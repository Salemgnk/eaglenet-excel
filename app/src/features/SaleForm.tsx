import { useEffect, useRef, useState, type FormEvent } from 'react'
import { createPendingClient, listClients, refreshClientsCache, type Client } from '../lib/clientsCache'
import { formatCount, formatCurrency } from '../lib/format'
import { saveSaleDraft } from '../lib/salesDrafts'
import { validateNumberField } from '../lib/validation'

interface SaleFormProps {
  siteId: string
  online: boolean
  onSaved: (draftId: string) => Promise<boolean>
}

type FieldName = 'bagsSold' | 'unitPrice'

type SavedStatus = 'local' | 'synced' | null

interface LastSaved {
  createdAt: string
  clientName: string
  bagsSold: number
  unitPrice: number
  totalAmount: number
  synced: boolean
}

export function SaleForm({ siteId, online, onSaved }: SaleFormProps) {
  const [clients, setClients] = useState<Client[]>([])
  const [clientId, setClientId] = useState('')
  const [creatingClient, setCreatingClient] = useState(false)
  const [newClientName, setNewClientName] = useState('')
  const [newClientContact, setNewClientContact] = useState('')
  const [clientError, setClientError] = useState(false)

  const [bagsSold, setBagsSold] = useState('')
  const [unitPrice, setUnitPrice] = useState('')
  const [notes, setNotes] = useState('')
  const [errors, setErrors] = useState<Partial<Record<FieldName, boolean>>>({})
  const [submitting, setSubmitting] = useState(false)
  const [savedStatus, setSavedStatus] = useState<SavedStatus>(null)
  const [lastSaved, setLastSaved] = useState<LastSaved | null>(null)
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  async function loadClients() {
    setClients(await listClients())
  }

  useEffect(() => {
    loadClients()
    if (online) {
      refreshClientsCache(siteId).then(loadClients)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [siteId, online])

  useEffect(() => {
    return () => {
      if (hideTimer.current) clearTimeout(hideTimer.current)
    }
  }, [])

  function showStatus(status: SavedStatus) {
    setSavedStatus(status)
    if (hideTimer.current) clearTimeout(hideTimer.current)
    hideTimer.current = setTimeout(() => setSavedStatus(null), 2000)
  }

  const bagsResult = validateNumberField(bagsSold, true)
  const priceResult = validateNumberField(unitPrice, true)
  const total = bagsResult.error || priceResult.error ? 0 : bagsResult.value * priceResult.value

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()

    const results = {
      bagsSold: validateNumberField(bagsSold, true),
      unitPrice: validateNumberField(unitPrice, true),
    }
    const nextErrors: Partial<Record<FieldName, boolean>> = {}
    let hasError = false
    for (const field of Object.keys(results) as FieldName[]) {
      if (results[field].error) {
        nextErrors[field] = true
        hasError = true
      }
    }
    setErrors(nextErrors)

    let resolvedClientId = clientId
    let resolvedClientName = clients.find((c) => c.id === clientId)?.name ?? ''
    if (creatingClient) {
      if (!newClientName.trim()) {
        setClientError(true)
        hasError = true
      } else {
        const client = await createPendingClient(newClientName.trim(), newClientContact.trim())
        resolvedClientId = client.id
        resolvedClientName = client.name
      }
    } else if (!clientId) {
      setClientError(true)
      hasError = true
    }

    if (hasError) return
    setClientError(false)

    setSubmitting(true)
    const totalAmount = results.bagsSold.value * results.unitPrice.value
    const draft = await saveSaleDraft({
      client_id: resolvedClientId,
      bags_sold: results.bagsSold.value,
      unit_price: results.unitPrice.value,
      total_amount: totalAmount,
      notes,
    })

    setClientId('')
    setCreatingClient(false)
    setNewClientName('')
    setNewClientContact('')
    setBagsSold('')
    setUnitPrice('')
    setNotes('')
    setErrors({})
    setSubmitting(false)
    showStatus('local')
    setLastSaved({
      createdAt: draft.created_at,
      clientName: resolvedClientName,
      bagsSold: results.bagsSold.value,
      unitPrice: results.unitPrice.value,
      totalAmount,
      synced: false,
    })
    await loadClients()

    onSaved(draft.id).then((synced) => {
      if (synced) {
        showStatus('synced')
        setLastSaved((current) =>
          current && current.createdAt === draft.created_at ? { ...current, synced: true } : current,
        )
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="entry-form" noValidate>
      <label>
        Client
        <select
          className={clientError && !creatingClient ? 'invalid' : undefined}
          value={creatingClient ? '__new__' : clientId}
          onChange={(e) => {
            if (e.target.value === '__new__') {
              setCreatingClient(true)
              setClientId('')
            } else {
              setCreatingClient(false)
              setClientId(e.target.value)
            }
            setClientError(false)
          }}
        >
          <option value="">Choose a client…</option>
          {clients.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
          <option value="__new__">+ New client</option>
        </select>
        {clientError && !creatingClient && <span className="field-error">Choose a client</span>}
      </label>

      {creatingClient && (
        <>
          <label>
            New client name
            <input
              type="text"
              placeholder="e.g. Kwame Rice Traders"
              className={clientError ? 'invalid' : undefined}
              value={newClientName}
              onChange={(e) => setNewClientName(e.target.value)}
            />
            {clientError && <span className="field-error">Name required</span>}
          </label>
          <label>
            Contact (optional)
            <input
              type="text"
              placeholder="Phone or email"
              value={newClientContact}
              onChange={(e) => setNewClientContact(e.target.value)}
            />
          </label>
        </>
      )}

      <label>
        Bags sold
        <input
          type="number"
          inputMode="numeric"
          min="0"
          placeholder="e.g. 20"
          className={errors.bagsSold ? 'invalid' : undefined}
          value={bagsSold}
          onChange={(e) => setBagsSold(e.target.value)}
          required
        />
        {errors.bagsSold && (
          <span className="field-error">
            {bagsSold.trim() === '' ? 'Value required' : 'Must be a positive number'}
          </span>
        )}
      </label>

      <label>
        Price per bag (GH₵)
        <input
          type="number"
          inputMode="decimal"
          min="0"
          placeholder="0.00"
          className={errors.unitPrice ? 'invalid' : undefined}
          value={unitPrice}
          onChange={(e) => setUnitPrice(e.target.value)}
          required
        />
        {errors.unitPrice && (
          <span className="field-error">
            {unitPrice.trim() === '' ? 'Value required' : 'Must be a positive number'}
          </span>
        )}
      </label>

      <p className="field-hint">Total amount: {formatCurrency(total)}</p>

      <label>
        Notes
        <textarea
          placeholder="Optional notes…"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </label>

      <button type="submit" disabled={submitting}>
        {submitting ? 'Saving…' : 'Save sale'}
      </button>

      {savedStatus && (
        <p className={`saved${savedStatus === 'synced' ? ' synced' : ''}`} role="status">
          {savedStatus === 'synced' ? 'Synced ✓' : 'Saved locally ✓'}
        </p>
      )}

      {lastSaved && (
        <div className="last-saved">
          <p className="field-hint">
            Last sale {lastSaved.synced ? 'synced' : 'pending send'}:
          </p>
          <dl className="entry-readout">
            <dt>Client</dt>
            <dd>{lastSaved.clientName}</dd>
            <dt>Bags</dt>
            <dd>{formatCount(lastSaved.bagsSold)}</dd>
            <dt>Price/bag</dt>
            <dd>{formatCurrency(lastSaved.unitPrice)}</dd>
            <dt>Total</dt>
            <dd>{formatCurrency(lastSaved.totalAmount)}</dd>
          </dl>
        </div>
      )}
    </form>
  )
}
