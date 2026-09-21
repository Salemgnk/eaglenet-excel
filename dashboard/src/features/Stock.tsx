import { useMemo } from 'react'
import { formatCount } from '../lib/format'
import { useLiveEntries } from '../lib/useLiveEntries'
import { useSales } from '../lib/useSales'
import { StockChart } from './StockChart'

interface StockProps {
  siteId: string
}

interface Movement {
  id: string
  created_at: string
  kind: 'production' | 'sale'
  bags: number // signed: +production, -sale
}

export function Stock({ siteId }: StockProps) {
  const { entries, loading: entriesLoading } = useLiveEntries(siteId)
  const { sales, loading: salesLoading } = useSales(siteId)

  // Only entries the mill milled for itself become Stock — service milling
  // (a client's own rice) never belongs to the mill, so it never counts.
  const ownProduction = useMemo(
    () => entries.filter((e) => e.entry_type === 'own_production'),
    [entries],
  )

  const untyped = useMemo(() => entries.filter((e) => e.entry_type == null).length, [entries])

  const movements = useMemo<Movement[]>(() => {
    const production: Movement[] = ownProduction.map((e) => ({
      id: e.id,
      created_at: e.created_at,
      kind: 'production',
      bags: e.bags_milled,
    }))
    const sold: Movement[] = sales.map((s) => ({
      id: s.id,
      created_at: s.created_at,
      kind: 'sale',
      bags: -s.bags_sold,
    }))
    return [...production, ...sold].sort((a, b) => a.created_at.localeCompare(b.created_at))
  }, [ownProduction, sales])

  const total = useMemo(() => movements.reduce((sum, m) => sum + m.bags, 0), [movements])

  const series = useMemo(
    () =>
      movements.reduce<{ date: string; value: number }[]>((acc, m) => {
        const previous = acc.length > 0 ? acc[acc.length - 1].value : 0
        acc.push({ date: m.created_at, value: previous + m.bags })
        return acc
      }, []),
    [movements],
  )

  if (entriesLoading || salesLoading) return <p className="loading">Loading…</p>

  return (
    <div className="stock-page">
      <div className="stock-headline">
        <p className="field-hint">Processed rice stock to date</p>
        <p className="stock-total">
          {formatCount(total)} <span className="stock-unit">bags</span>
        </p>
        <p className="stock-note">
          Rice produced by the mill itself (excluding service milling for clients), minus
          what's already been sold.
        </p>
        {untyped > 0 && (
          <p className="stock-note stock-note--warning">
            {untyped} {untyped > 1 ? 'entries' : 'entry'} with no milling type recorded could
            not be classified and {untyped > 1 ? "don't" : "doesn't"} count toward this total.
          </p>
        )}
      </div>

      {series.length > 1 && (
        <div className="stock-chart-card">
          <h2 className="section-title">Cumulative stock over time</h2>
          <StockChart series={series} />
        </div>
      )}

      <div className="section-header">
        <h2 className="section-title">Movements</h2>
      </div>

      {movements.length === 0 ? (
        <p>No movements yet.</p>
      ) : (
        <table className="entries-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Type</th>
              <th className="numeric">Bags</th>
            </tr>
          </thead>
          <tbody>
            {[...movements].reverse().map((m) => (
              <tr key={`${m.kind}-${m.id}`}>
                <td>{new Date(m.created_at).toLocaleString('en-GB')}</td>
                <td>
                  <span className={`type-pill type-pill--${m.kind === 'production' ? 'own_production' : 'service'}`}>
                    {m.kind === 'production' ? 'Production' : 'Sale'}
                  </span>
                </td>
                <td className="numeric">
                  {m.bags > 0 ? '+' : ''}
                  {formatCount(m.bags)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
