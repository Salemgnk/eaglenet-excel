import { useMemo } from 'react'
import { formatCount } from '../lib/format'
import { useLiveEntries } from '../lib/useLiveEntries'
import { StockChart } from './StockChart'

interface StockProps {
  siteId: string
}

export function Stock({ siteId }: StockProps) {
  const { entries, loading } = useLiveEntries(siteId)

  // Only entries the mill milled for itself become Stock — service milling
  // (a client's own rice) never belongs to the mill, so it never counts.
  const ownProduction = useMemo(
    () => entries.filter((e) => e.entry_type === 'own_production'),
    [entries],
  )

  const untyped = useMemo(() => entries.filter((e) => e.entry_type == null).length, [entries])

  const chronological = useMemo(
    () => [...ownProduction].sort((a, b) => a.created_at.localeCompare(b.created_at)),
    [ownProduction],
  )

  const total = useMemo(
    () => chronological.reduce((sum, e) => sum + e.bags_milled, 0),
    [chronological],
  )

  const series = useMemo(
    () =>
      chronological.reduce<{ date: string; value: number }[]>((acc, e) => {
        const previous = acc.length > 0 ? acc[acc.length - 1].value : 0
        acc.push({ date: e.created_at, value: previous + e.bags_milled })
        return acc
      }, []),
    [chronological],
  )

  if (loading) return <p className="loading">Chargement…</p>

  return (
    <div className="stock-page">
      <div className="stock-headline">
        <p className="field-hint">Stock riz transformé à ce jour</p>
        <p className="stock-total">
          {formatCount(total)} <span className="stock-unit">sacs</span>
        </p>
        <p className="stock-note">
          Cumul du riz produit par la rizerie elle-même depuis le début (hors service de
          mouture pour des clients) — n'inclut pas encore les sorties (vente, livraison),
          qui arriveront avec le module Ventes.
        </p>
        {untyped > 0 && (
          <p className="stock-note stock-note--warning">
            {untyped} entrée{untyped > 1 ? 's' : ''} sans type de mouture renseigné n'
            {untyped > 1 ? 'ont' : 'a'} pas pu être classée{untyped > 1 ? 's' : ''} et n'
            {untyped > 1 ? 'entrent' : 'entre'} pas dans ce total.
          </p>
        )}
      </div>

      {series.length > 1 && (
        <div className="stock-chart-card">
          <h2 className="section-title">Évolution du stock cumulé</h2>
          <StockChart series={series} />
        </div>
      )}

      <div className="section-header">
        <h2 className="section-title">Mouvements (entrées de production)</h2>
      </div>

      {chronological.length === 0 ? (
        <p>Aucune entrée pour l'instant.</p>
      ) : (
        <table className="entries-table">
          <thead>
            <tr>
              <th>Date</th>
              <th className="numeric">Sacs</th>
            </tr>
          </thead>
          <tbody>
            {[...chronological].reverse().map((e) => (
              <tr key={e.id}>
                <td>{new Date(e.created_at).toLocaleString('fr-FR')}</td>
                <td className="numeric">{formatCount(e.bags_milled)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
