import { useEffect, useMemo, useState } from 'react'
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { formatCount, formatCurrency } from '../lib/format'
import { supabase } from '../lib/supabase'
import { useLiveEntries, type Entry, type EntryType } from '../lib/useLiveEntries'
import { DeleteRowButton } from './DeleteRowButton'
import { KpiCard } from './KpiCard'

const ENTRY_TYPE_LABEL: Record<EntryType, string> = {
  own_production: 'Own production',
  service: 'Service milling',
}

function TypeBadge({ entryType }: { entryType: EntryType | null }) {
  if (!entryType) return <span className="type-pill">—</span>
  return <span className={`type-pill type-pill--${entryType}`}>{ENTRY_TYPE_LABEL[entryType]}</span>
}

type Period = 'today' | '7d' | '30d' | 'all'
type Granularity = 'day' | 'week' | 'month'
type SortField = 'created_at' | 'bags_milled' | 'revenue' | 'expenses' | 'other'
type SortDir = 'asc' | 'desc'

const PERIODS: { id: Period; label: string }[] = [
  { id: 'today', label: 'Today' },
  { id: '7d', label: '7 days' },
  { id: '30d', label: '30 days' },
  { id: 'all', label: 'All' },
]

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

const PAGE_SIZE = 25

async function deleteEntry(id: string) {
  await supabase.from('entries').delete().eq('id', id)
}

function periodStart(period: Period): Date | null {
  const now = new Date()
  if (period === 'today') {
    return new Date(now.getFullYear(), now.getMonth(), now.getDate())
  }
  if (period === '7d') {
    return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  }
  if (period === '30d') {
    return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
  }
  return null
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
  const [period, setPeriod] = useState<Period>('7d')
  const [granularity, setGranularity] = useState<Granularity>('day')
  const [search, setSearch] = useState('')
  const [sortField, setSortField] = useState<SortField>('created_at')
  const [sortDir, setSortDir] = useState<SortDir>('desc')
  const [showOther, setShowOther] = useState(true)
  const [showNotes, setShowNotes] = useState(true)
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)

  const filtered = useMemo(() => {
    const start = periodStart(period)
    if (!start) return entries
    return entries.filter((entry) => new Date(entry.created_at) >= start)
  }, [entries, period])

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
  }, [entries, period])

  const dailySparklines = useMemo(() => {
    const daily = groupedTotals(filtered, 'day').slice().reverse()
    return {
      bags_milled: daily.map((d) => d.bags_milled),
      revenue: daily.map((d) => d.revenue),
      expenses: daily.map((d) => d.expenses),
      other: daily.map((d) => d.other),
    }
  }, [filtered])

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

  // A new period, search, or sort starts the entry-detail list over at one
  // page rather than leaving visibleCount pointing past a now-smaller list.
  useEffect(() => {
    setVisibleCount(PAGE_SIZE)
  }, [period, search, sortField, sortDir])

  const displayedEntries = useMemo(() => sorted.slice(0, visibleCount), [sorted, visibleCount])

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

  if (loading) return <p className="loading">Loading…</p>

  return (
    <div className="dashboard">
      <nav className="period-selector">
        {PERIODS.map((p) => (
          <button
            key={p.id}
            className={period === p.id ? 'active' : ''}
            onClick={() => setPeriod(p.id)}
          >
            {p.label}
          </button>
        ))}
      </nav>

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
          value={formatCurrency(totals.expenses)}
          change={previousTotals && percentChange(totals.expenses, previousTotals.expenses)}
          sparkline={dailySparklines.expenses}
        />
        <KpiCard
          label="Other"
          value={formatCurrency(totals.other)}
          change={previousTotals && percentChange(totals.other, previousTotals.other)}
          sparkline={dailySparklines.other}
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
            <>
              <table className="entries-table">
                <thead>
                  <tr>
                    {sortableHeader('created_at', 'Date')}
                    <th>Type</th>
                    {sortableHeader('bags_milled', 'Bags', true)}
                    {sortableHeader('revenue', 'Revenue', true)}
                    {sortableHeader('expenses', 'Expenses', true)}
                    {showOther && sortableHeader('other', 'Other', true)}
                    {showNotes && <th>Notes</th>}
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {displayedEntries.map((entry) => (
                    <tr key={entry.id}>
                      <td>{new Date(entry.created_at).toLocaleString('en-GB')}</td>
                      <td>
                        <TypeBadge entryType={entry.entry_type} />
                      </td>
                      <td className="numeric">{formatCount(entry.bags_milled)}</td>
                      <td className="numeric">{formatCurrency(entry.revenue)}</td>
                      <td className="numeric">{formatCurrency(entry.expenses)}</td>
                      {showOther && <td className="numeric">{formatCurrency(entry.other)}</td>}
                      {showNotes && <td>{entry.notes}</td>}
                      <td>
                        <DeleteRowButton onDelete={() => deleteEntry(entry.id)} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {visibleCount < sorted.length && (
                <div className="load-more">
                  <button className="secondary" onClick={() => setVisibleCount((v) => v + PAGE_SIZE)}>
                    Load more ({sorted.length - visibleCount} remaining)
                  </button>
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  )
}
