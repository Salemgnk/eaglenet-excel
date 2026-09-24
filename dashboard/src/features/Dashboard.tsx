import { useEffect, useMemo, useState } from 'react'
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { formatCount, formatCurrency } from '../lib/format'
import { PERIODS, periodStart, type Period } from '../lib/period'
import { supabase } from '../lib/supabase'
import { useExpenses } from '../lib/useExpenses'
import { useLiveEntries, type Entry, type EntryType } from '../lib/useLiveEntries'
import { DeleteRowButton } from './DeleteRowButton'
import { KpiCard } from './KpiCard'

interface OperatorProfile {
  id: string
  name: string | null
  email: string | null
}

const ENTRY_TYPE_LABEL: Record<EntryType, string> = {
  own_production: 'Own production',
  service: 'Service milling',
}

function TypeBadge({ entryType }: { entryType: EntryType | null }) {
  if (!entryType) return <span className="type-pill">—</span>
  return <span className={`type-pill type-pill--${entryType}`}>{ENTRY_TYPE_LABEL[entryType]}</span>
}

type Granularity = 'day' | 'week' | 'month'
type SortField = 'created_at' | 'bags_milled' | 'revenue' | 'expenses' | 'other'
type SortDir = 'asc' | 'desc'

const GRANULARITIES: { id: Granularity; label: string }[] = [
  { id: 'day', label: 'Day' },
  { id: 'week', label: 'Week' },
  { id: 'month', label: 'Month' },
]

const GROUP_SECTION_TITLE: Record<Granularity, string> = {
  day: 'By day',
  week: 'By week',
  month: 'By month',
}

async function deleteEntry(id: string) {
  await supabase.from('entries').delete().eq('id', id)
}

function sum(entries: Entry[], field: keyof Pick<Entry, 'bags_milled' | 'revenue' | 'expenses' | 'other'>) {
  return entries.reduce((total, entry) => total + entry[field], 0)
}

// The window immediately before the current one, same duration — "All" has
// no meaningful prior window to compare against.
function previousPeriodRange(period: Period): { start: Date; end: Date } | null {
  const start = periodStart(period)
  if (!start) return null
  const end = new Date()
  const durationMs = end.getTime() - start.getTime()
  return { start: new Date(start.getTime() - durationMs), end: start }
}

function percentChange(current: number, previous: number): number | null {
  if (previous === 0) return current === 0 ? null : 100
  return ((current - previous) / Math.abs(previous)) * 100
}

// Shared by entries and expenses — both filter to the same active window
// (period preset or custom range) so the Expenses KPI card tracks the same
// dates as the rest of the Dashboard.
function filterByRange<T extends { created_at: string }>(
  rows: T[],
  range: { start: Date | null; end: Date | null },
): T[] {
  return rows.filter((row) => {
    const t = new Date(row.created_at)
    if (range.start && t < range.start) return false
    if (range.end && t > range.end) return false
    return true
  })
}

interface GroupTotal {
  key: string
  label: string
  bags_milled: number
  revenue: number
  expenses: number
  other: number
}

function startOfWeek(date: Date): Date {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  const day = d.getDay()
  const diff = day === 0 ? -6 : 1 - day
  d.setDate(d.getDate() + diff)
  return d
}

function groupKeyAndLabel(date: Date, granularity: Granularity): { key: string; label: string } {
  if (granularity === 'day') {
    return {
      key: date.toLocaleDateString('en-CA'),
      label: date.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' }),
    }
  }
  if (granularity === 'week') {
    const monday = startOfWeek(date)
    return {
      key: monday.toLocaleDateString('en-CA'),
      label: `Week of ${monday.toLocaleDateString('en-GB', { day: 'numeric', month: 'long' })}`,
    }
  }
  return {
    key: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`,
    label: date.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' }),
  }
}

function groupedTotals(entries: Entry[], granularity: Granularity): GroupTotal[] {
  const byKey = new Map<string, { label: string; entries: Entry[] }>()
  for (const entry of entries) {
    const { key, label } = groupKeyAndLabel(new Date(entry.created_at), granularity)
    const bucket = byKey.get(key)
    if (bucket) bucket.entries.push(entry)
    else byKey.set(key, { label, entries: [entry] })
  }
  return Array.from(byKey.entries())
    .map(([key, { label, entries: groupEntries }]) => ({
      key,
      label,
      bags_milled: sum(groupEntries, 'bags_milled'),
      revenue: sum(groupEntries, 'revenue'),
      expenses: sum(groupEntries, 'expenses'),
      other: sum(groupEntries, 'other'),
    }))
    .sort((a, b) => b.key.localeCompare(a.key))
}

interface DashboardProps {
  siteId: string
}

export function Dashboard({ siteId }: DashboardProps) {
  const { entries, loading } = useLiveEntries(siteId)
  const { expenses, loading: expensesLoading } = useExpenses(siteId)
  const [operators, setOperators] = useState<OperatorProfile[]>([])
  const [period, setPeriod] = useState<Period>('7d')
  // An explicit custom range overrides the quick period buttons entirely —
  // picking either date clears `period` so only one filter is ever active
  // (same pattern as Expenses).
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [granularity, setGranularity] = useState<Granularity>('day')
  const [search, setSearch] = useState('')
  const [sortField, setSortField] = useState<SortField>('created_at')
  const [sortDir, setSortDir] = useState<SortDir>('desc')
  const [showOther, setShowOther] = useState(true)
  const [showNotes, setShowNotes] = useState(true)

  useEffect(() => {
    supabase
      .from('profiles')
      .select('id, name, email')
      .eq('site_id', siteId)
      .in('role', ['operator', 'owner'])
      .then(({ data }) => {
        if (data) setOperators(data)
      })
  }, [siteId])

  const operatorName = useMemo(() => {
    const byId = new Map(operators.map((o) => [o.id, o.name ?? o.email ?? 'Unknown']))
    return (id: string) => byId.get(id) ?? 'Unknown'
  }, [operators])

  const usingCustomRange = dateFrom !== '' || dateTo !== ''

  const activeRange = useMemo(
    () => ({
      start: usingCustomRange ? (dateFrom ? new Date(`${dateFrom}T00:00:00`) : null) : periodStart(period),
      end: usingCustomRange && dateTo ? new Date(`${dateTo}T23:59:59.999`) : null,
    }),
    [period, usingCustomRange, dateFrom, dateTo],
  )

  const filtered = useMemo(() => filterByRange(entries, activeRange), [entries, activeRange])

  const filteredExpenses = useMemo(() => filterByRange(expenses, activeRange), [expenses, activeRange])

  function selectPeriod(p: Period) {
    setPeriod(p)
    setDateFrom('')
    setDateTo('')
  }

  const totals = useMemo(
    () => ({
      bags_milled: sum(filtered, 'bags_milled'),
      revenue: sum(filtered, 'revenue'),
      expenses: sum(filtered, 'expenses'),
      other: sum(filtered, 'other'),
    }),
    [filtered],
  )

  const grouped = useMemo(() => groupedTotals(filtered, granularity), [filtered, granularity])

  const previousTotals = useMemo(() => {
    if (usingCustomRange) return null
    const range = previousPeriodRange(period)
    if (!range) return null
    const previousEntries = entries.filter((entry) => {
      const t = new Date(entry.created_at)
      return t >= range.start && t < range.end
    })
    return {
      bags_milled: sum(previousEntries, 'bags_milled'),
      revenue: sum(previousEntries, 'revenue'),
      expenses: sum(previousEntries, 'expenses'),
      other: sum(previousEntries, 'other'),
    }
  }, [entries, period, usingCustomRange])

  // The real operating-expenses total, from the Expenses ledger — not
  // entries.expenses, which is a dead per-batch field for this account.
  const expensesTotal = useMemo(() => filteredExpenses.reduce((sum, e) => sum + e.amount, 0), [filteredExpenses])

  const previousExpensesTotal = useMemo(() => {
    if (usingCustomRange) return null
    const range = previousPeriodRange(period)
    if (!range) return null
    return expenses
      .filter((e) => {
        const t = new Date(e.created_at)
        return t >= range.start && t < range.end
      })
      .reduce((sum, e) => sum + e.amount, 0)
  }, [expenses, period, usingCustomRange])

  const dailySparklines = useMemo(() => {
    const daily = groupedTotals(filtered, 'day').slice().reverse()
    return {
      bags_milled: daily.map((d) => d.bags_milled),
      revenue: daily.map((d) => d.revenue),
      expenses: daily.map((d) => d.expenses),
      other: daily.map((d) => d.other),
    }
  }, [filtered])

  const expensesDailySparkline = useMemo(() => {
    const byDay = new Map<string, number>()
    for (const e of filteredExpenses) {
      const key = new Date(e.created_at).toLocaleDateString('en-CA')
      byDay.set(key, (byDay.get(key) ?? 0) + e.amount)
    }
    return Array.from(byDay.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([, total]) => total)
  }, [filteredExpenses])

  const searched = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return filtered
    return filtered.filter((entry) => (entry.notes ?? '').toLowerCase().includes(q))
  }, [filtered, search])

  const sorted = useMemo(() => {
    const dir = sortDir === 'asc' ? 1 : -1
    return [...searched].sort((a, b) => {
      if (sortField === 'created_at') return a.created_at.localeCompare(b.created_at) * dir
      return (a[sortField] - b[sortField]) * dir
    })
  }, [searched, sortField, sortDir])

  function toggleSort(field: SortField) {
    if (sortField === field) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortField(field)
      setSortDir('desc')
    }
  }

  function sortIndicator(field: SortField) {
    if (sortField !== field) return null
    return <span className="sort-arrow">{sortDir === 'asc' ? '▲' : '▼'}</span>
  }

  function sortableHeader(field: SortField, label: string, numeric = false) {
    return (
      <th
        className={numeric ? 'sortable numeric' : 'sortable'}
        onClick={() => toggleSort(field)}
      >
        {label}
        {sortIndicator(field)}
      </th>
    )
  }

  if (loading || expensesLoading) return <p className="loading">Loading…</p>

  return (
    <div className="dashboard">
      <div className="table-toolbar">
        <nav className="period-selector">
          {PERIODS.map((p) => (
            <button
              key={p.id}
              className={!usingCustomRange && period === p.id ? 'active' : ''}
              onClick={() => selectPeriod(p.id)}
            >
              {p.label}
            </button>
          ))}
        </nav>
        <label>
          From
          <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
        </label>
        <label>
          To
          <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
        </label>
        {usingCustomRange && (
          <button
            className="secondary"
            onClick={() => {
              setDateFrom('')
              setDateTo('')
            }}
          >
            Clear range
          </button>
        )}
      </div>

      <div className="totals-band">
        <KpiCard
          label="Bags milled"
          value={formatCount(totals.bags_milled)}
          change={previousTotals && percentChange(totals.bags_milled, previousTotals.bags_milled)}
          sparkline={dailySparklines.bags_milled}
        />
        <KpiCard
          label="Revenue"
          value={formatCurrency(totals.revenue)}
          change={previousTotals && percentChange(totals.revenue, previousTotals.revenue)}
          sparkline={dailySparklines.revenue}
        />
        <KpiCard
          label="Expenses"
          value={formatCurrency(expensesTotal)}
          change={previousExpensesTotal !== null ? percentChange(expensesTotal, previousExpensesTotal) : null}
          sparkline={expensesDailySparkline}
        />
      </div>

      {filtered.length === 0 ? (
        <p>No entries for this period.</p>
      ) : (
        <>
          {grouped.length > 1 && (
            <>
              <div className="section-header">
                <h2 className="section-title">{GROUP_SECTION_TITLE[granularity]}</h2>
                <nav className="period-selector small">
                  {GRANULARITIES.map((g) => (
                    <button
                      key={g.id}
                      className={granularity === g.id ? 'active' : ''}
                      onClick={() => setGranularity(g.id)}
                    >
                      {g.label}
                    </button>
                  ))}
                </nav>
              </div>
              <div className="chart-card">
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={[...grouped].reverse()}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                    <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => formatCurrency(v)} width={80} />
                    <Tooltip formatter={(value: any) => formatCurrency(Number(value))} />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Line type="monotone" dataKey="revenue" name="Revenue" stroke="#10b981" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="expenses" name="Expenses" stroke="#dc2626" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="other" name="Other" stroke="#64748b" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <table className="entries-table">
                <thead>
                  <tr>
                    <th>{GRANULARITIES.find((g) => g.id === granularity)?.label}</th>
                    <th className="numeric">Bags</th>
                    <th className="numeric">Revenue</th>
                    <th className="numeric">Expenses</th>
                    <th className="numeric">Other</th>
                  </tr>
                </thead>
                <tbody>
                  {grouped.map((g) => (
                    <tr key={g.key}>
                      <td className="capitalize">{g.label}</td>
                      <td className="numeric">{formatCount(g.bags_milled)}</td>
                      <td className="numeric">{formatCurrency(g.revenue)}</td>
                      <td className="numeric">{formatCurrency(g.expenses)}</td>
                      <td className="numeric">{formatCurrency(g.other)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}

          <div className="section-header">
            <h2 className="section-title">Entry detail</h2>
            <div className="table-toolbar">
              <input
                type="search"
                className="search-input"
                placeholder="Search notes…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <div className="column-toggles">
                <label>
                  <input
                    type="checkbox"
                    checked={showOther}
                    onChange={(e) => setShowOther(e.target.checked)}
                  />
                  Other
                </label>
                <label>
                  <input
                    type="checkbox"
                    checked={showNotes}
                    onChange={(e) => setShowNotes(e.target.checked)}
                  />
                  Notes
                </label>
              </div>
            </div>
          </div>

          {sorted.length === 0 ? (
            <p>No results for this search.</p>
          ) : (
            <table className="entries-table">
              <thead>
                <tr>
                  {sortableHeader('created_at', 'Date')}
                  <th>Submitted by</th>
                  <th>Type</th>
                  {sortableHeader('bags_milled', 'Bags', true)}
                  {sortableHeader('revenue', 'Revenue', true)}
                  {sortableHeader('expenses', 'Expenses', true)}
                  {showOther && sortableHeader('other', 'Other', true)}
                  {showNotes && <th>Notes</th>}
                  <th className="actions-col"></th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((entry) => (
                  <tr key={entry.id}>
                    <td>{new Date(entry.created_at).toLocaleString('en-GB')}</td>
                    <td>{operatorName(entry.operator_id)}</td>
                    <td>
                      <TypeBadge entryType={entry.entry_type} />
                    </td>
                    <td className="numeric">{formatCount(entry.bags_milled)}</td>
                    <td className="numeric">{formatCurrency(entry.revenue)}</td>
                    <td className="numeric">{formatCurrency(entry.expenses)}</td>
                    {showOther && <td className="numeric">{formatCurrency(entry.other)}</td>}
                    {showNotes && <td>{entry.notes}</td>}
                    <td className="actions-col">
                      <DeleteRowButton onDelete={() => deleteEntry(entry.id)} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </>
      )}
    </div>
  )
}
