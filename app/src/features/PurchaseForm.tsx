import { useEffect, useRef, useState, type FormEvent } from 'react'
import { formatCount, formatCurrency } from '../lib/format'
import { savePurchaseDraft } from '../lib/purchaseDrafts'
import {
  createPendingSupplier,
  listSuppliers,
  refreshSuppliersCache,
  type Supplier,
} from '../lib/suppliersCache'
import { validateNumberField } from '../lib/validation'

interface PurchaseFormProps {
  siteId: string
  online: boolean
  onSaved: (draftId: string) => Promise<boolean>
}

type FieldName = 'bagsBought' | 'unitPrice'

type SavedStatus = 'local' | 'synced' | null

interface LastSaved {
  createdAt: string
  supplierName: string
  bagsBought: number
  unitPrice: number
  totalAmount: number
  synced: boolean
}

export function PurchaseForm({ siteId, online, onSaved }: PurchaseFormProps) {
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [supplierId, setSupplierId] = useState('')
  const [creatingSupplier, setCreatingSupplier] = useState(false)
  const [newSupplierName, setNewSupplierName] = useState('')
  const [newSupplierContact, setNewSupplierContact] = useState('')
  const [supplierError, setSupplierError] = useState(false)

  const [bagsBought, setBagsBought] = useState('')
  const [unitPrice, setUnitPrice] = useState('')
  const [notes, setNotes] = useState('')
  const [errors, setErrors] = useState<Partial<Record<FieldName, boolean>>>({})
  const [submitting, setSubmitting] = useState(false)
  const [savedStatus, setSavedStatus] = useState<SavedStatus>(null)
  const [lastSaved, setLastSaved] = useState<LastSaved | null>(null)
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  async function loadSuppliers() {
    setSuppliers(await listSuppliers())
  }

  useEffect(() => {
    loadSuppliers()
    if (online) {
      refreshSuppliersCache(siteId).then(loadSuppliers)
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

  const bagsResult = validateNumberField(bagsBought, true)
  const priceResult = validateNumberField(unitPrice, true)
  const total = bagsResult.error || priceResult.error ? 0 : bagsResult.value * priceResult.value

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()

    const results = {
      bagsBought: validateNumberField(bagsBought, true),
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

    let resolvedSupplierId = supplierId
    let resolvedSupplierName = suppliers.find((s) => s.id === supplierId)?.name ?? ''
    if (creatingSupplier) {
      if (!newSupplierName.trim()) {
        setSupplierError(true)
        hasError = true
      } else {
        const supplier = await createPendingSupplier(
          newSupplierName.trim(),
          newSupplierContact.trim(),
        )
        resolvedSupplierId = supplier.id
        resolvedSupplierName = supplier.name
      }
    } else if (!supplierId) {
      setSupplierError(true)
      hasError = true
    }

    if (hasError) return
    setSupplierError(false)

    setSubmitting(true)
    const totalAmount = results.bagsBought.value * results.unitPrice.value
    const draft = await savePurchaseDraft({
      supplier_id: resolvedSupplierId,
      bags_bought: results.bagsBought.value,
      unit_price: results.unitPrice.value,
      total_amount: totalAmount,
      notes,
    })

    setSupplierId('')
    setCreatingSupplier(false)
    setNewSupplierName('')
    setNewSupplierContact('')
    setBagsBought('')
    setUnitPrice('')
    setNotes('')
    setErrors({})
    setSubmitting(false)
    showStatus('local')
    setLastSaved({
      createdAt: draft.created_at,
      supplierName: resolvedSupplierName,
      bagsBought: results.bagsBought.value,
      unitPrice: results.unitPrice.value,
      totalAmount,
      synced: false,
    })
    await loadSuppliers()

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
        Supplier
        <select
          className={supplierError && !creatingSupplier ? 'invalid' : undefined}
          value={creatingSupplier ? '__new__' : supplierId}
          onChange={(e) => {
            if (e.target.value === '__new__') {
              setCreatingSupplier(true)
              setSupplierId('')
            } else {
              setCreatingSupplier(false)
              setSupplierId(e.target.value)
            }
            setSupplierError(false)
          }}
        >
          <option value="">Choose a supplier…</option>
          {suppliers.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
          <option value="__new__">+ New supplier</option>
        </select>
        {supplierError && !creatingSupplier && (
          <span className="field-error">Choose a supplier</span>
        )}
      </label>

      {creatingSupplier && (
        <>
          <label>
            New supplier name
            <input
              type="text"
              className={supplierError ? 'invalid' : undefined}
              value={newSupplierName}
              onChange={(e) => setNewSupplierName(e.target.value)}
            />
            {supplierError && <span className="field-error">Name required</span>}
          </label>
          <label>
            Contact (optional)
            <input
              type="text"
              value={newSupplierContact}
              onChange={(e) => setNewSupplierContact(e.target.value)}
            />
          </label>
        </>
      )}

      <label>
        Bags bought
        <input
          type="number"
          inputMode="numeric"
          min="0"
          className={errors.bagsBought ? 'invalid' : undefined}
          value={bagsBought}
          onChange={(e) => setBagsBought(e.target.value)}
          required
        />
        {errors.bagsBought && (
          <span className="field-error">
            {bagsBought.trim() === '' ? 'Value required' : 'Must be a positive number'}
          </span>
        )}
      </label>

      <label>
        Price per bag (GH₵)
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
            {unitPrice.trim() === '' ? 'Value required' : 'Must be a positive number'}
          </span>
        )}
      </label>

      <p className="field-hint">Total amount: {formatCurrency(total)}</p>

      <label>
        Notes
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} />
      </label>

      <button type="submit" disabled={submitting}>
        {submitting ? 'Saving…' : 'Save purchase'}
      </button>

      {savedStatus && (
        <p className={`saved${savedStatus === 'synced' ? ' synced' : ''}`} role="status">
          {savedStatus === 'synced' ? 'Synced ✓' : 'Saved locally ✓'}
        </p>
      )}

      {lastSaved && (
        <div className="last-saved">
          <p className="field-hint">
            Last purchase {lastSaved.synced ? 'synced' : 'pending send'}:
          </p>
          <dl className="entry-readout">
            <dt>Supplier</dt>
            <dd>{lastSaved.supplierName}</dd>
            <dt>Bags</dt>
            <dd>{formatCount(lastSaved.bagsBought)}</dd>
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
