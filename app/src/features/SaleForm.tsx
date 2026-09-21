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
          <option value="">Choisir un client…</option>
          {clients.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
          <option value="__new__">+ Nouveau client</option>
        </select>
        {clientError && !creatingClient && <span className="field-error">Choisissez un client</span>}
      </label>

      {creatingClient && (
        <>
          <label>
            Nom du nouveau client
            <input
              type="text"
              className={clientError ? 'invalid' : undefined}
              value={newClientName}
              onChange={(e) => setNewClientName(e.target.value)}
            />
            {clientError && <span className="field-error">Nom requis</span>}
          </label>
          <label>
            Contact (optionnel)
            <input
              type="text"
              value={newClientContact}
              onChange={(e) => setNewClientContact(e.target.value)}
            />
          </label>
        </>
      )}

      <label>
        Sacs vendus
        <input
          type="number"
          inputMode="numeric"
          min="0"
          className={errors.bagsSold ? 'invalid' : undefined}
          value={bagsSold}
          onChange={(e) => setBagsSold(e.target.value)}
          required
        />
        {errors.bagsSold && (
          <span className="field-error">
            {bagsSold.trim() === '' ? 'Valeur requise' : 'Doit être un nombre positif'}
          </span>
        )}
      </label>

      <label>
        Prix par sac (GH₵)
        <input
          type="number"
          inputMode="decimal"
          min="0"
          className={errors.unitPrice ? 'invalid' : undefined}
          value={unitPrice}
          onChange={(e) => setUnitPrice(e.target.value)}
          required
        />
        {errors.unitPrice && (
          <span className="field-error">
            {unitPrice.trim() === '' ? 'Valeur requise' : 'Doit être un nombre positif'}
          </span>
        )}
      </label>

      <p className="field-hint">Montant total : {formatCurrency(total)}</p>

      <label>
        Notes
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} />
      </label>

      <button type="submit" disabled={submitting}>
        {submitting ? 'Enregistrement…' : 'Enregistrer la vente'}
      </button>

      {savedStatus && (
        <p className={`saved${savedStatus === 'synced' ? ' synced' : ''}`} role="status">
          {savedStatus === 'synced' ? 'Synchronisé ✓' : 'Enregistré localement ✓'}
        </p>
      )}

      {lastSaved && (
        <div className="last-saved">
          <p className="field-hint">
            Dernière vente {lastSaved.synced ? 'synchronisée' : "en attente d'envoi"} :
          </p>
          <dl className="entry-readout">
            <dt>Client</dt>
            <dd>{lastSaved.clientName}</dd>
            <dt>Sacs</dt>
            <dd>{formatCount(lastSaved.bagsSold)}</dd>
            <dt>Prix/sac</dt>
            <dd>{formatCurrency(lastSaved.unitPrice)}</dd>
            <dt>Total</dt>
            <dd>{formatCurrency(lastSaved.totalAmount)}</dd>
          </dl>
        </div>
      )}
    </form>
  )
}
