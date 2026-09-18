import { useMemo, useState } from 'react'
import { formatCount, formatCurrency } from '../lib/format'
import { useLiveEntries, type Entry } from '../lib/useLiveEntries'

type Period = 'today' | '7d' | '30d' | 'all'
type Granularity = 'day' | 'week' | 'month'
type SortField = 'created_at' | 'bags_milled' | 'revenue' | 'expenses' | 'other'
type SortDir = 'asc' | 'desc'

const PERIODS: { id: Period; label: string }[] = [
  { id: 'today', label: "Aujourd'hui" },
  { id: '7d', label: '7 jours' },
  { id: '30d', label: '30 jours' },
  { id: 'all', label: 'Tout' },
]

const GRANULARITIES: { id: Granularity; label: string }[] = [
  { id: 'day', label: 'Jour' },
  { id: 'week', label: 'Semaine' },
  { id: 'month', label: 'Mois' },
]

const GROUP_SECTION_TITLE: Record<Granularity, string> = {
  day: 'Par jour',
  week: 'Par semaine',
  month: 'Par mois',
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
      key: date.toLocaleDateString('fr-CA'),
      label: date.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' }),
    }
  }
  if (granularity === 'week') {
    const monday = startOfWeek(date)
    return {
      key: monday.toLocaleDateString('fr-CA'),
      label: `Semaine du ${monday.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}`,
    }
  }
  return {
    key: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`,
    label: date.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }),
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

  if (loading) return <p className="loading">Chargement…</p>

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

      <div className="stat-grid">
        <div className="stat-card">
          <p className="field-hint">Sacs moulus</p>
          <p className="stat-readout">{formatCount(totals.bags_milled)}</p>
        </div>
        <div className="stat-card">
          <p className="field-hint">Revenu</p>
          <p className="stat-readout">{formatCurrency(totals.revenue)}</p>
        </div>
        <div className="stat-card">
          <p className="field-hint">Dépenses</p>
          <p className="stat-readout">{formatCurrency(totals.expenses)}</p>
        </div>
        <div className="stat-card">
          <p className="field-hint">Autre</p>
          <p className="stat-readout">{formatCurrency(totals.other)}</p>
        </div>
      </div>

      {filtered.length === 0 ? (
        <p>Aucune entrée sur cette période.</p>
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
                    <th className="numeric">Sacs</th>
                    <th className="numeric">Revenu</th>
                    <th className="numeric">Dépenses</th>
                    <th className="numeric">Autre</th>
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
            <h2 className="section-title">Détail des entrées</h2>
            <div className="table-toolbar">
              <input
                type="search"
                className="search-input"
                placeholder="Rechercher dans les notes…"
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
                  Autre
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
            <p>Aucun résultat pour cette recherche.</p>
          ) : (
            <table className="entries-table">
              <thead>
                <tr>
                  {sortableHeader('created_at', 'Date')}
                  {sortableHeader('bags_milled', 'Sacs', true)}
                  {sortableHeader('revenue', 'Revenu', true)}
                  {sortableHeader('expenses', 'Dépenses', true)}
                  {showOther && sortableHeader('other', 'Autre', true)}
                  {showNotes && <th>Notes</th>}
                </tr>
              </thead>
              <tbody>
                {sorted.map((entry) => (
                  <tr key={entry.id}>
                    <td>{new Date(entry.created_at).toLocaleString('fr-FR')}</td>
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
