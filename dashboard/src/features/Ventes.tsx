import { useMemo, useState } from 'react'
import { formatCount, formatCurrency } from '../lib/format'
import { supabase } from '../lib/supabase'
import { useClients } from '../lib/useClients'
import { useSales } from '../lib/useSales'
import { DeleteRowButton } from './DeleteRowButton'

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
    return (clientId: string) => byId.get(clientId) ?? 'Unknown client'
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
      setError(!clientId ? 'Choose a client' : 'Bags and price must be positive numbers')
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

  async function deleteSale(id: string) {
    await supabase.from('sales').delete().eq('id', id)
  }

  if (salesLoading || clientsLoading) return <p className="loading">Loading…</p>

  return (
    <div className="ventes-page">
      <div className="totals-band">
        <div className="totals-band-item">
          <p className="field-hint">Bags sold</p>
          <p className="stat-readout">{formatCount(totalBags)}</p>
        </div>
        <div className="totals-band-item">
          <p className="field-hint">Total amount</p>
          <p className="stat-readout">{formatCurrency(totalRevenue)}</p>
        </div>
      </div>

      <div className="section-header">
        <h2 className="section-title">Sales</h2>
        <button className="secondary" onClick={() => setAdding((v) => !v)}>
          {adding ? 'Cancel' : '+ New sale'}
        </button>
      </div>

      {adding && (
        <div className="inline-form">
          <label>
            Client
            <select value={clientId} onChange={(e) => setClientId(e.target.value)}>
              <option value="">Choose a client…</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Bags sold
            <input type="number" min="0" value={bagsSold} onChange={(e) => setBagsSold(e.target.value)} />
          </label>
          <label>
            Price/bag (GH₵)
            <input type="number" min="0" value={unitPrice} onChange={(e) => setUnitPrice(e.target.value)} />
          </label>
          <label>
            Notes
            <input type="text" value={notes} onChange={(e) => setNotes(e.target.value)} />
          </label>
          <p className="field-hint">Total: {formatCurrency(total)}</p>
          {error && (
            <p className="error" role="alert">
              {error}
            </p>
          )}
          <button className="primary" onClick={addSale} disabled={saving}>
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      )}

      {sales.length === 0 ? (
        <p>No sales yet.</p>
      ) : (
        <table className="entries-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Client</th>
              <th className="numeric">Bags</th>
              <th className="numeric">Price/bag</th>
              <th className="numeric">Amount</th>
              <th>Notes</th>
              <th className="actions-col"></th>
            </tr>
          </thead>
          <tbody>
            {sales.map((sale) => (
              <tr key={sale.id}>
                <td>{new Date(sale.created_at).toLocaleString('en-GB')}</td>
                <td>{clientName(sale.client_id)}</td>
                <td className="numeric">{formatCount(sale.bags_sold)}</td>
                <td className="numeric">{formatCurrency(sale.unit_price)}</td>
                <td className="numeric">{formatCurrency(sale.total_amount)}</td>
                <td>{sale.notes}</td>
                <td className="actions-col">
                  <DeleteRowButton onDelete={() => deleteSale(sale.id)} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
