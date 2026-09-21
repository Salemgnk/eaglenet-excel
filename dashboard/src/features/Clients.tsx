import { useMemo, useState } from 'react'
import { formatCurrency } from '../lib/format'
import { supabase } from '../lib/supabase'
import { useClients } from '../lib/useClients'
import { usePayments } from '../lib/usePayments'
import { useSales } from '../lib/useSales'

interface ClientsProps {
  siteId: string
  userId: string
}

export function Clients({ siteId, userId }: ClientsProps) {
  const { clients, loading: clientsLoading } = useClients(siteId)
  const { sales, loading: salesLoading } = useSales(siteId)
  const { payments, loading: paymentsLoading } = usePayments(siteId)

  const [addingClient, setAddingClient] = useState(false)
  const [newName, setNewName] = useState('')
  const [newContact, setNewContact] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [payingClientId, setPayingClientId] = useState<string | null>(null)
  const [paymentAmount, setPaymentAmount] = useState('')
  const [paymentError, setPaymentError] = useState<string | null>(null)

  const balances = useMemo(() => {
    const byClient = new Map<string, { sold: number; paid: number }>()
    for (const client of clients) byClient.set(client.id, { sold: 0, paid: 0 })
    for (const sale of sales) {
      const entry = byClient.get(sale.client_id)
      if (entry) entry.sold += sale.total_amount
    }
    for (const payment of payments) {
      const entry = byClient.get(payment.client_id)
      if (entry) entry.paid += payment.amount
    }
    return byClient
  }, [clients, sales, payments])

  async function addClient() {
    if (!newName.trim()) {
      setError('Nom requis')
      return
    }
    setSaving(true)
    setError(null)
    const { error: insertError } = await supabase
      .from('clients')
      .insert({ site_id: siteId, name: newName.trim(), contact: newContact.trim() || null })
    setSaving(false)
    if (insertError) {
      setError(insertError.message)
      return
    }
    setNewName('')
    setNewContact('')
    setAddingClient(false)
  }

  async function recordPayment(clientId: string) {
    const amount = Number(paymentAmount.trim())
    if (!Number.isFinite(amount) || amount <= 0) {
      setPaymentError('Montant invalide')
      return
    }
    const { error: insertError } = await supabase
      .from('payments')
      .insert({ site_id: siteId, client_id: clientId, amount, recorded_by: userId })
    if (insertError) {
      setPaymentError(insertError.message)
      return
    }
    setPayingClientId(null)
    setPaymentAmount('')
    setPaymentError(null)
  }

  if (clientsLoading || salesLoading || paymentsLoading) return <p className="loading">Chargement…</p>

  return (
    <div className="clients-page">
      <div className="section-header">
        <h2 className="section-title">Clients</h2>
        <button className="secondary" onClick={() => setAddingClient((v) => !v)}>
          {addingClient ? 'Annuler' : '+ Nouveau client'}
        </button>
      </div>

      {addingClient && (
        <div className="inline-form">
          <label>
            Nom
            <input type="text" value={newName} onChange={(e) => setNewName(e.target.value)} />
          </label>
          <label>
            Contact (optionnel)
            <input type="text" value={newContact} onChange={(e) => setNewContact(e.target.value)} />
          </label>
          {error && (
            <p className="error" role="alert">
              {error}
            </p>
          )}
          <button className="primary" onClick={addClient} disabled={saving}>
            {saving ? 'Enregistrement…' : 'Ajouter'}
          </button>
        </div>
      )}

      {clients.length === 0 ? (
        <p>Aucun client pour l'instant.</p>
      ) : (
        <table className="entries-table">
          <thead>
            <tr>
              <th>Nom</th>
              <th>Contact</th>
              <th className="numeric">Solde dû</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {clients.map((client) => {
              const balance = balances.get(client.id)
              const due = (balance?.sold ?? 0) - (balance?.paid ?? 0)
              return (
                <tr key={client.id}>
                  <td>{client.name}</td>
                  <td>{client.contact || '—'}</td>
                  <td className="numeric">{formatCurrency(due)}</td>
                  <td>
                    {payingClientId === client.id ? (
                      <span className="inline-payment">
                        <input
                          type="number"
                          min="0"
                          className="search-input"
                          placeholder="Montant"
                          value={paymentAmount}
                          onChange={(e) => setPaymentAmount(e.target.value)}
                        />
                        <button className="primary" onClick={() => recordPayment(client.id)}>
                          Valider
                        </button>
                        <button
                          className="secondary"
                          onClick={() => {
                            setPayingClientId(null)
                            setPaymentError(null)
                          }}
                        >
                          Annuler
                        </button>
                        {paymentError && (
                          <span className="field-error">{paymentError}</span>
                        )}
                      </span>
                    ) : (
                      <button
                        className="secondary"
                        onClick={() => {
                          setPayingClientId(client.id)
                          setPaymentAmount('')
                        }}
                      >
                        Enregistrer un paiement
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
