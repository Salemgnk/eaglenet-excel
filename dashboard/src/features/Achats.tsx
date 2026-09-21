import { useMemo, useState } from 'react'
import { formatCount, formatCurrency } from '../lib/format'
import { supabase } from '../lib/supabase'
import { usePurchases } from '../lib/usePurchases'
import { useSuppliers } from '../lib/useSuppliers'

interface AchatsProps {
  siteId: string
  userId: string
}

export function Achats({ siteId, userId }: AchatsProps) {
  const { purchases, loading: purchasesLoading } = usePurchases(siteId)
  const { suppliers, loading: suppliersLoading } = useSuppliers(siteId)

  const [adding, setAdding] = useState(false)
  const [supplierId, setSupplierId] = useState('')
  const [bagsBought, setBagsBought] = useState('')
  const [unitPrice, setUnitPrice] = useState('')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const supplierName = useMemo(() => {
    const byId = new Map(suppliers.map((s) => [s.id, s.name]))
    return (supplierId: string) => byId.get(supplierId) ?? 'Unknown supplier'
  }, [suppliers])

  const totalSpent = useMemo(() => purchases.reduce((sum, p) => sum + p.total_amount, 0), [purchases])
  const totalBags = useMemo(() => purchases.reduce((sum, p) => sum + p.bags_bought, 0), [purchases])

  const bags = Number(bagsBought.trim())
  const price = Number(unitPrice.trim())
  const total = Number.isFinite(bags) && Number.isFinite(price) ? bags * price : 0

  async function addPurchase() {
    const bagsValid = Number.isFinite(bags) && bags > 0
    const priceValid = Number.isFinite(price) && price > 0
    if (!supplierId || !bagsValid || !priceValid) {
      setError(!supplierId ? 'Choose a supplier' : 'Bags and price must be positive numbers')
      return
    }
    setSaving(true)
    setError(null)
    const { error: insertError } = await supabase.from('purchases').insert({
      site_id: siteId,
      supplier_id: supplierId,
      created_by: userId,
      bags_bought: bags,
      unit_price: price,
      total_amount: bags * price,
      notes: notes.trim() || null,
    })
    setSaving(false)
    if (insertError) {
      setError(insertError.message)
      return
    }
    setSupplierId('')
    setBagsBought('')
    setUnitPrice('')
    setNotes('')
    setAdding(false)
  }

  if (purchasesLoading || suppliersLoading) return <p className="loading">Loading…</p>

  return (
    <div className="ventes-page">
      <div className="totals-band">
        <div className="totals-band-item">
          <p className="field-hint">Bags bought</p>
          <p className="stat-readout">{formatCount(totalBags)}</p>
        </div>
        <div className="totals-band-item">
          <p className="field-hint">Total amount</p>
          <p className="stat-readout">{formatCurrency(totalSpent)}</p>
        </div>
      </div>

      <div className="section-header">
        <h2 className="section-title">Purchases</h2>
        <button className="secondary" onClick={() => setAdding((v) => !v)}>
          {adding ? 'Cancel' : '+ New purchase'}
        </button>
      </div>

      {adding && (
        <div className="inline-form">
          <label>
            Supplier
            <select value={supplierId} onChange={(e) => setSupplierId(e.target.value)}>
              <option value="">Choose a supplier…</option>
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Bags bought
            <input type="number" min="0" value={bagsBought} onChange={(e) => setBagsBought(e.target.value)} />
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
          <button className="primary" onClick={addPurchase} disabled={saving}>
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      )}

      {purchases.length === 0 ? (
        <p>No purchases yet.</p>
      ) : (
        <table className="entries-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Supplier</th>
              <th className="numeric">Bags</th>
              <th className="numeric">Price/bag</th>
              <th className="numeric">Amount</th>
              <th>Notes</th>
            </tr>
          </thead>
          <tbody>
            {purchases.map((purchase) => (
              <tr key={purchase.id}>
                <td>{new Date(purchase.created_at).toLocaleString('en-GB')}</td>
                <td>{supplierName(purchase.supplier_id)}</td>
                <td className="numeric">{formatCount(purchase.bags_bought)}</td>
                <td className="numeric">{formatCurrency(purchase.unit_price)}</td>
                <td className="numeric">{formatCurrency(purchase.total_amount)}</td>
                <td>{purchase.notes}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
