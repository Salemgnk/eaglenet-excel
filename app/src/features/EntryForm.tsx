import { useState, type FormEvent } from 'react'
import { saveDraft } from '../lib/drafts'
import { validateNumberField } from '../lib/validation'

interface EntryFormProps {
  onSaved: () => void
}

type FieldName = 'bagsMilled' | 'revenue' | 'expenses' | 'other'

const REQUIRED: Record<FieldName, boolean> = {
  bagsMilled: true,
  revenue: true,
  expenses: true,
  other: false,
}

export function EntryForm({ onSaved }: EntryFormProps) {
  const [bagsMilled, setBagsMilled] = useState('')
  const [revenue, setRevenue] = useState('')
  const [expenses, setExpenses] = useState('')
  const [other, setOther] = useState('')
  const [notes, setNotes] = useState('')
  const [errors, setErrors] = useState<Partial<Record<FieldName, boolean>>>({})
  const [submitting, setSubmitting] = useState(false)
  const [savedMessage, setSavedMessage] = useState(false)

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
    if (hasError) return

    setSubmitting(true)
    await saveDraft({
      bags_milled: results.bagsMilled.value,
      revenue: results.revenue.value,
      expenses: results.expenses.value,
      other: results.other.value,
      notes,
    })
    setBagsMilled('')
    setRevenue('')
    setExpenses('')
    setOther('')
    setNotes('')
    setErrors({})
    onSaved()
    setSubmitting(false)
    setSavedMessage(true)
    setTimeout(() => setSavedMessage(false), 2000)
  }

  function field(name: FieldName, label: string, required: boolean) {
    return (
      <label>
        {label}
        <input
          type="number"
          inputMode={name === 'bagsMilled' ? 'numeric' : 'decimal'}
          min="0"
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
              ? 'Valeur requise'
              : 'Doit être un nombre positif'}
          </span>
        )}
      </label>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="entry-form" noValidate>
      {field('bagsMilled', 'Sacs moulus', REQUIRED.bagsMilled)}
      {field('revenue', 'Revenu', REQUIRED.revenue)}
      {field('expenses', 'Dépenses', REQUIRED.expenses)}
      {field('other', 'Autre', REQUIRED.other)}
      <label>
        Notes
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} />
      </label>
      <button type="submit" disabled={submitting}>
        {submitting ? 'Enregistrement…' : 'Enregistrer'}
      </button>
      {savedMessage && (
        <p className="saved" role="status">
          Enregistré localement ✓
        </p>
      )}
    </form>
  )
}
