import { useMemo, useState } from 'react'
import { formatCount, formatCurrency } from '../lib/format'
import { supabase } from '../lib/supabase'
import { useClients } from '../lib/useClients'
import { useSales } from '../lib/useSales'

interface VentesProps {
  siteId: string
  userId: string
}

export function Ventes({ siteId, userId }: VentesProps) {
  const { sales, loading: salesLoading } = useSales(siteId)
  const { clients, loading: clientsLoading } = useClients(siteId)

  const [adding, setAdding] = useState(false)
  const [clientId, setClientId] = useState('')
  const [bagsSold, setBagsSold] = useState('')
  const [unitPrice, setUnitPrice] = useState('')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const clientName = useMemo(() => {
    const byId = new Map(clients.map((c) => [c.id, c.name]))
    return (clientId: string) => byId.get(clientId) ?? 'Client inconnu'
  }, [clients])

  const totalRevenue = useMemo(() => sales.reduce((sum, s) => sum + s.total_amount, 0), [sales])
  const totalBags = useMemo(() => sales.reduce((sum, s) => sum + s.bags_sold, 0), [sales])

  const bags = Number(bagsSold.trim())
  const price = Number(unitPrice.trim())
  const total = Number.isFinite(bags) && Number.isFinite(price) ? bags * price : 0

  async function addSale() {
    const bagsValid = Number.isFinite(bags) && bags > 0
    const priceValid = Number.isFinite(price) && price > 0
    if (!clientId || !bagsValid || !priceValid) {
      setError(!clientId ? 'Choisissez un client' : 'Sacs et prix doivent être des nombres positifs')
      return
    }
    setSaving(true)
    setError(null)
    const { error: insertError } = await supabase.from('sales').insert({
      site_id: siteId,
      client_id: clientId,
      created_by: userId,
      bags_sold: bags,
      unit_price: price,
      total_amount: bags * price,
      notes: notes.trim() || null,
    })
    setSaving(false)
    if (insertError) {
      setError(insertError.message)
      return
    }
    setClientId('')
    setBagsSold('')
    setUnitPrice('')
    setNotes('')
    setAdding(false)
  }

  if (salesLoading || clientsLoading) return <p className="loading">Chargement…</p>

  return (
    <div className="ventes-page">
      <div className="totals-band">
        <div className="totals-band-item">
          <p className="field-hint">Sacs vendus</p>
          <p className="stat-readout">{formatCount(totalBags)}</p>
        </div>
        <div className="totals-band-item">
          <p className="field-hint">Montant total</p>
          <p className="stat-readout">{formatCurrency(totalRevenue)}</p>
        </div>
      </div>

      <div className="section-header">
        <h2 className="section-title">Ventes</h2>
        <button className="secondary" onClick={() => setAdding((v) => !v)}>
          {adding ? 'Annuler' : '+ Nouvelle vente'}
        </button>
      </div>

      {adding && (
        <div className="inline-form">
          <label>
            Client
            <select value={clientId} onChange={(e) => setClientId(e.target.value)}>
              <option value="">Choisir un client…</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Sacs vendus
            <input type="number" min="0" value={bagsSold} onChange={(e) => setBagsSold(e.target.value)} />
          </label>
          <label>
            Prix/sac (GH₵)
            <input type="number" min="0" value={unitPrice} onChange={(e) => setUnitPrice(e.target.value)} />
          </label>
          <label>
            Notes
            <input type="text" value={notes} onChange={(e) => setNotes(e.target.value)} />
          </label>
          <p className="field-hint">Total : {formatCurrency(total)}</p>
          {error && (
            <p className="error" role="alert">
              {error}
            </p>
          )}
          <button className="primary" onClick={addSale} disabled={saving}>
            {saving ? 'Enregistrement…' : 'Enregistrer'}
          </button>
        </div>
      )}

      {sales.length === 0 ? (
        <p>Aucune vente pour l'instant.</p>
      ) : (
        <table className="entries-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Client</th>
              <th className="numeric">Sacs</th>
              <th className="numeric">Prix/sac</th>
              <th className="numeric">Montant</th>
              <th>Notes</th>
            </tr>
          </thead>
          <tbody>
            {sales.map((sale) => (
              <tr key={sale.id}>
                <td>{new Date(sale.created_at).toLocaleString('fr-FR')}</td>
                <td>{clientName(sale.client_id)}</td>
                <td className="numeric">{formatCount(sale.bags_sold)}</td>
                <td className="numeric">{formatCurrency(sale.unit_price)}</td>
                <td className="numeric">{formatCurrency(sale.total_amount)}</td>
                <td>{sale.notes}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
