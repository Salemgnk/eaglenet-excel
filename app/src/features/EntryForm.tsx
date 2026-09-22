import { useEffect, useRef, useState, type FormEvent } from 'react'
import { saveDraft, type EntryType } from '../lib/drafts'
import { formatCount, formatCurrency } from '../lib/format'
import { validateNumberField } from '../lib/validation'

interface EntryFormProps {
  onSaved: (draftId: string) => Promise<boolean>
}

type FieldName = 'bagsMilled' | 'revenue' | 'expenses' | 'other'

const REQUIRED: Record<FieldName, boolean> = {
  bagsMilled: true,
  revenue: true,
  expenses: true,
  other: false,
}

type SavedStatus = 'local' | 'synced' | null

interface LastSaved {
  createdAt: string
  entryType: EntryType
  bagsMilled: number
  revenue: number
  expenses: number
  other: number
  synced: boolean
}

const ENTRY_TYPE_LABEL: Record<EntryType, string> = {
  own_production: 'Own production',
  service: 'Service milling',
}

export function EntryForm({ onSaved }: EntryFormProps) {
  const [entryType, setEntryType] = useState<EntryType | null>(null)
  const [entryTypeError, setEntryTypeError] = useState(false)
  const [bagsMilled, setBagsMilled] = useState('')
  const [revenue, setRevenue] = useState('')
  const [expenses, setExpenses] = useState('')
  const [other, setOther] = useState('')
  const [notes, setNotes] = useState('')
  const [errors, setErrors] = useState<Partial<Record<FieldName, boolean>>>({})
  const [submitting, setSubmitting] = useState(false)
  const [savedStatus, setSavedStatus] = useState<SavedStatus>(null)
  const [lastSaved, setLastSaved] = useState<LastSaved | null>(null)
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

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

  const raw: Record<FieldName, string> = { bagsMilled, revenue, expenses, other }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()

    const results = {
      bagsMilled: validateNumberField(bagsMilled, REQUIRED.bagsMilled),
      revenue: validateNumberField(revenue, REQUIRED.revenue),
      expenses: validateNumberField(expenses, REQUIRED.expenses),
      other: validateNumberField(other, REQUIRED.other),
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
    setEntryTypeError(!entryType)
    if (hasError || !entryType) return

    setSubmitting(true)
    const draft = await saveDraft({
      entry_type: entryType,
      bags_milled: results.bagsMilled.value,
      revenue: results.revenue.value,
      expenses: results.expenses.value,
      other: results.other.value,
      notes,
    })
    setEntryType(null)
    setBagsMilled('')
    setRevenue('')
    setExpenses('')
    setOther('')
    setNotes('')
    setErrors({})
    setSubmitting(false)
    showStatus('local')
    setLastSaved({
      createdAt: draft.created_at,
      entryType: draft.entry_type,
      bagsMilled: results.bagsMilled.value,
      revenue: results.revenue.value,
      expenses: results.expenses.value,
      other: results.other.value,
      synced: false,
    })

    // Don't block the next entry on the sync round-trip — just upgrade the
    // confirmation to "Synced" if and when it actually lands. The
    // transient toast fades either way; this trace stays on screen so an
    // operator who looks back later still sees proof the entry landed.
    onSaved(draft.id).then((synced) => {
      if (synced) {
        showStatus('synced')
        setLastSaved((current) =>
          current && current.createdAt === draft.created_at
            ? { ...current, synced: true }
            : current,
        )
      }
    })
  }

  function field(name: FieldName, label: string, required: boolean, placeholder: string) {
    return (
      <label>
        {label}
        <input
          type="number"
          inputMode={name === 'bagsMilled' ? 'numeric' : 'decimal'}
          min="0"
          placeholder={placeholder}
          className={errors[name] ? 'invalid' : undefined}
          value={raw[name]}
          onChange={(e) => {
            const setters: Record<FieldName, (v: string) => void> = {
              bagsMilled: setBagsMilled,
              revenue: setRevenue,
              expenses: setExpenses,
              other: setOther,
            }
            setters[name](e.target.value)
          }}
          required={required}
        />
        {errors[name] && (
          <span className="field-error">
            {raw[name].trim() === ''
              ? 'Value required'
              : 'Must be a positive number'}
          </span>
        )}
      </label>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="entry-form" noValidate>
      <div role="radiogroup" aria-label="Milling type">
        <p className="field-hint">Milling type</p>
        <div className="tabs entry-type-toggle">
          <button
            type="button"
            role="radio"
            aria-checked={entryType === 'own_production'}
            className={entryType === 'own_production' ? 'active' : ''}
            onClick={() => {
              setEntryType('own_production')
              setEntryTypeError(false)
            }}
          >
            Own production
          </button>
          <button
            type="button"
            role="radio"
            aria-checked={entryType === 'service'}
            className={entryType === 'service' ? 'active' : ''}
            onClick={() => {
              setEntryType('service')
              setEntryTypeError(false)
            }}
          >
            Service milling
          </button>
        </div>
        {entryTypeError && <span className="field-error">Choose a type</span>}
      </div>
      {field('bagsMilled', 'Bags milled', REQUIRED.bagsMilled, 'e.g. 50')}
      {field('revenue', 'Revenue', REQUIRED.revenue, '0.00')}
      {field('expenses', 'Expenses', REQUIRED.expenses, '0.00')}
      {field('other', 'Other', REQUIRED.other, '0.00')}
      <label>
        Notes
        <textarea
          placeholder="Optional notes…"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </label>
      <button type="submit" disabled={submitting}>
        {submitting ? 'Saving…' : 'Save'}
      </button>
      {savedStatus && (
        <p className={`saved${savedStatus === 'synced' ? ' synced' : ''}`} role="status">
          {savedStatus === 'synced' ? 'Synced ✓' : 'Saved locally ✓'}
        </p>
      )}
      {lastSaved && (
        <div className="last-saved">
          <p className="field-hint">
            Last entry {lastSaved.synced ? 'synced' : 'pending send'}:
          </p>
          <span className={`type-pill type-pill--${lastSaved.entryType}`}>
            {ENTRY_TYPE_LABEL[lastSaved.entryType]}
          </span>
          <dl className="entry-readout">
            <dt>Bags</dt>
            <dd>{formatCount(lastSaved.bagsMilled)}</dd>
            <dt>Revenue</dt>
            <dd>{formatCurrency(lastSaved.revenue)}</dd>
            <dt>Expenses</dt>
            <dd>{formatCurrency(lastSaved.expenses)}</dd>
            <dt>Other</dt>
            <dd>{formatCurrency(lastSaved.other)}</dd>
          </dl>
        </div>
      )}
    </form>
  )
}
