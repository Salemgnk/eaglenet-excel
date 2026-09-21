import { useMemo, useState } from 'react'
import { formatCount, formatCurrency } from '../lib/format'
import { useLiveEntries, type Entry, type EntryType } from '../lib/useLiveEntries'

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
        <div className="totals-band-item">
          <p className="field-hint">Bags milled</p>
          <p className="stat-readout">{formatCount(totals.bags_milled)}</p>
        </div>
        <div className="totals-band-item">
          <p className="field-hint">Revenue</p>
          <p className="stat-readout">{formatCurrency(totals.revenue)}</p>
        </div>
        <div className="totals-band-item">
          <p className="field-hint">Expenses</p>
          <p className="stat-readout">{formatCurrency(totals.expenses)}</p>
        </div>
        <div className="totals-band-item">
          <p className="field-hint">Other</p>
          <p className="stat-readout">{formatCurrency(totals.other)}</p>
        </div>
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
                  <th>Type</th>
                  {sortableHeader('bags_milled', 'Bags', true)}
                  {sortableHeader('revenue', 'Revenue', true)}
                  {sortableHeader('expenses', 'Expenses', true)}
                  {showOther && sortableHeader('other', 'Other', true)}
                  {showNotes && <th>Notes</th>}
                </tr>
              </thead>
              <tbody>
                {sorted.map((entry) => (
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
