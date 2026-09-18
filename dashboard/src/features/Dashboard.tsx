import { useMemo, useState } from 'react'
import { useLiveEntries, type Entry } from '../lib/useLiveEntries'

type Period = 'today' | '7d' | '30d' | 'all'

const PERIODS: { id: Period; label: string }[] = [
  { id: 'today', label: "Aujourd'hui" },
  { id: '7d', label: '7 jours' },
  { id: '30d', label: '30 jours' },
  { id: 'all', label: 'Tout' },
]

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

interface DashboardProps {
  siteId: string
}

export function Dashboard({ siteId }: DashboardProps) {
  const { entries, loading } = useLiveEntries(siteId)
  const [period, setPeriod] = useState<Period>('7d')

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
          <p className="stat-readout">{totals.bags_milled}</p>
        </div>
        <div className="stat-card">
          <p className="field-hint">Revenu</p>
          <p className="stat-readout">{totals.revenue}</p>
        </div>
        <div className="stat-card">
          <p className="field-hint">Dépenses</p>
          <p className="stat-readout">{totals.expenses}</p>
        </div>
        <div className="stat-card">
          <p className="field-hint">Autre</p>
          <p className="stat-readout">{totals.other}</p>
        </div>
      </div>

      {filtered.length === 0 ? (
        <p>Aucune entrée sur cette période.</p>
      ) : (
        <table className="entries-table">
          <thead>
            <tr>
              <th>Date</th>
              <th className="numeric">Sacs</th>
              <th className="numeric">Revenu</th>
              <th className="numeric">Dépenses</th>
              <th className="numeric">Autre</th>
              <th>Notes</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((entry) => (
              <tr key={entry.id}>
                <td>{new Date(entry.created_at).toLocaleString('fr-FR')}</td>
                <td className="numeric">{entry.bags_milled}</td>
                <td className="numeric">{entry.revenue}</td>
                <td className="numeric">{entry.expenses}</td>
                <td className="numeric">{entry.other}</td>
                <td>{entry.notes}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
