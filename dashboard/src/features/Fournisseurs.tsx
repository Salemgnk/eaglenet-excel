import { useMemo, useState } from 'react'
import { formatCurrency } from '../lib/format'
import { supabase } from '../lib/supabase'
import { usePurchases } from '../lib/usePurchases'
import { useSupplierPayments } from '../lib/useSupplierPayments'
import { useSuppliers } from '../lib/useSuppliers'

interface FournisseursProps {
  siteId: string
  userId: string
}

export function Fournisseurs({ siteId, userId }: FournisseursProps) {
  const { suppliers, loading: suppliersLoading } = useSuppliers(siteId)
  const { purchases, loading: purchasesLoading } = usePurchases(siteId)
  const { payments, loading: paymentsLoading } = useSupplierPayments(siteId)

  const [addingSupplier, setAddingSupplier] = useState(false)
  const [newName, setNewName] = useState('')
  const [newContact, setNewContact] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [payingSupplierId, setPayingSupplierId] = useState<string | null>(null)
  const [paymentAmount, setPaymentAmount] = useState('')
  const [paymentError, setPaymentError] = useState<string | null>(null)

  const balances = useMemo(() => {
    const bySupplier = new Map<string, { bought: number; paid: number }>()
    for (const supplier of suppliers) bySupplier.set(supplier.id, { bought: 0, paid: 0 })
    for (const purchase of purchases) {
      const entry = bySupplier.get(purchase.supplier_id)
      if (entry) entry.bought += purchase.total_amount
    }
    for (const payment of payments) {
      const entry = bySupplier.get(payment.supplier_id)
      if (entry) entry.paid += payment.amount
    }
    return bySupplier
  }, [suppliers, purchases, payments])

  async function addSupplier() {
    if (!newName.trim()) {
      setError('Name required')
      return
    }
    setSaving(true)
    setError(null)
    const { error: insertError } = await supabase
      .from('suppliers')
      .insert({ site_id: siteId, name: newName.trim(), contact: newContact.trim() || null })
    setSaving(false)
    if (insertError) {
      setError(insertError.message)
      return
    }
    setNewName('')
    setNewContact('')
    setAddingSupplier(false)
  }

  async function recordPayment(supplierId: string) {
    const amount = Number(paymentAmount.trim())
    if (!Number.isFinite(amount) || amount <= 0) {
      setPaymentError('Invalid amount')
      return
    }
    const { error: insertError } = await supabase
      .from('supplier_payments')
      .insert({ site_id: siteId, supplier_id: supplierId, amount, recorded_by: userId })
    if (insertError) {
      setPaymentError(insertError.message)
      return
    }
    setPayingSupplierId(null)
    setPaymentAmount('')
    setPaymentError(null)
  }

  if (suppliersLoading || purchasesLoading || paymentsLoading) return <p className="loading">Loading…</p>

  return (
    <div className="clients-page">
      <div className="section-header">
        <h2 className="section-title">Suppliers</h2>
        <button className="secondary" onClick={() => setAddingSupplier((v) => !v)}>
          {addingSupplier ? 'Cancel' : '+ New supplier'}
        </button>
      </div>

      {addingSupplier && (
        <div className="inline-form">
          <label>
            Name
            <input type="text" value={newName} onChange={(e) => setNewName(e.target.value)} />
          </label>
          <label>
            Contact (optional)
            <input type="text" value={newContact} onChange={(e) => setNewContact(e.target.value)} />
          </label>
          {error && (
            <p className="error" role="alert">
              {error}
            </p>
          )}
          <button className="primary" onClick={addSupplier} disabled={saving}>
            {saving ? 'Saving…' : 'Add'}
          </button>
        </div>
      )}

      {suppliers.length === 0 ? (
        <p>No suppliers yet.</p>
      ) : (
        <table className="entries-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Contact</th>
              <th className="numeric">Balance owed</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {suppliers.map((supplier) => {
              const balance = balances.get(supplier.id)
              const due = (balance?.bought ?? 0) - (balance?.paid ?? 0)
              return (
                <tr key={supplier.id}>
                  <td>{supplier.name}</td>
                  <td>{supplier.contact || '—'}</td>
                  <td className="numeric">{formatCurrency(due)}</td>
                  <td>
                    {payingSupplierId === supplier.id ? (
                      <span className="inline-payment">
                        <input
                          type="number"
                          min="0"
                          className="search-input"
                          placeholder="Amount"
                          value={paymentAmount}
                          onChange={(e) => setPaymentAmount(e.target.value)}
                        />
                        <button className="primary" onClick={() => recordPayment(supplier.id)}>
                          Confirm
                        </button>
                        <button
                          className="secondary"
                          onClick={() => {
                            setPayingSupplierId(null)
                            setPaymentError(null)
                          }}
                        >
                          Cancel
                        </button>
                        {paymentError && <span className="field-error">{paymentError}</span>}
                      </span>
                    ) : (
                      <button
                        className="secondary"
                        onClick={() => {
                          setPayingSupplierId(supplier.id)
                          setPaymentAmount('')
                        }}
                      >
                        Record a payment
                      </button>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      )}
    </div>
  )
}
