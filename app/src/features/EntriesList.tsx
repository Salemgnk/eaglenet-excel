import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { validateNumberField } from '../lib/validation'

interface Entry {
  id: string
  bags_milled: number
  revenue: number
  expenses: number
  other: number
  notes: string | null
  created_at: string
}

type FieldName = 'bags_milled' | 'revenue' | 'expenses' | 'other'

const REQUIRED: Record<FieldName, boolean> = {
  bags_milled: true,
  revenue: true,
  expenses: true,
  other: false,
}

const FIELD_LABELS: Record<FieldName, string> = {
  bags_milled: 'Sacs moulus',
  revenue: 'Revenu',
  expenses: 'Dépenses',
  other: 'Autre',
}

interface EditDraft {
  bags_milled: string
  revenue: string
  expenses: string
  other: string
  notes: string
}

export function EntriesList() {
  const [entries, setEntries] = useState<Entry[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [draftEdit, setDraftEdit] = useState<EditDraft>({
    bags_milled: '',
    revenue: '',
    expenses: '',
    other: '',
    notes: '',
  })
  const [errors, setErrors] = useState<Partial<Record<FieldName, boolean>>>({})
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function loadEntries() {
    setLoading(true)
    const { data, error } = await supabase
      .from('entries')
      .select('id, bags_milled, revenue, expenses, other, notes, created_at')
      .order('created_at', { ascending: false })
    if (!error && data) setEntries(data)
    setLoading(false)
  }

  useEffect(() => {
    loadEntries()
  }, [])

  function startEdit(entry: Entry) {
    setEditingId(entry.id)
    setDraftEdit({
      bags_milled: String(entry.bags_milled),
      revenue: String(entry.revenue),
      expenses: String(entry.expenses),
      other: String(entry.other),
      notes: entry.notes ?? '',
    })
    setErrors({})
    setError(null)
  }

  async function saveEdit(id: string) {
    const results = {
      bags_milled: validateNumberField(draftEdit.bags_milled, REQUIRED.bags_milled),
      revenue: validateNumberField(draftEdit.revenue, REQUIRED.revenue),
      expenses: validateNumberField(draftEdit.expenses, REQUIRED.expenses),
      other: validateNumberField(draftEdit.other, REQUIRED.other),
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

    setSaving(true)
    const { error } = await supabase
      .from('entries')
      .update({
        bags_milled: results.bags_milled.value,
        revenue: results.revenue.value,
        expenses: results.expenses.value,
        other: results.other.value,
        notes: draftEdit.notes || null,
      })
      .eq('id', id)

    if (error) {
      setError(error.message)
      setSaving(false)
      return
    }

    setEditingId(null)
    setSaving(false)
    await loadEntries()
  }

  function editField(name: FieldName) {
    return (
      <label>
        {FIELD_LABELS[name]}
        <input
          type="number"
          inputMode={name === 'bags_milled' ? 'numeric' : 'decimal'}
          min="0"
          required={REQUIRED[name]}
          className={errors[name] ? 'invalid' : undefined}
          value={draftEdit[name]}
          onChange={(e) => setDraftEdit({ ...draftEdit, [name]: e.target.value })}
        />
        {errors[name] && (
          <span className="field-error">
            {draftEdit[name].trim() === ''
              ? 'Valeur requise'
              : 'Doit être un nombre positif'}
          </span>
        )}
      </label>
    )
  }

  if (loading) return <p className="loading">Chargement…</p>

  return (
    <div className="entries-list">
      {!navigator.onLine && (
        <p className="offline-note">
          Hors-ligne : la correction d'une entrée nécessite une connexion.
        </p>
      )}
      {entries.length === 0 && <p>Aucune entrée envoyée pour l'instant.</p>}

      {entries.map((entry) => (
        <div key={entry.id} className="entry-card">
          {editingId === entry.id ? (
            <>
              {editField('bags_milled')}
              {editField('revenue')}
              {editField('expenses')}
              {editField('other')}
              <label>
                Notes
                <textarea
                  value={draftEdit.notes}
                  onChange={(e) => setDraftEdit({ ...draftEdit, notes: e.target.value })}
                />
              </label>
              {error && (
                <p className="error" role="alert">
                  {error}
                </p>
              )}
              <div className="edit-actions">
                <button
                  className="primary"
                  onClick={() => saveEdit(entry.id)}
                  disabled={saving}
                >
                  {saving ? 'Enregistrement…' : 'Enregistrer'}
                </button>
                <button
                  className="secondary"
                  onClick={() => setEditingId(null)}
                  disabled={saving}
                >
                  Annuler
                </button>
              </div>
            </>
          ) : (
            <>
              <p className="entry-date">
                {new Date(entry.created_at).toLocaleString('fr-FR')}
              </p>
              <dl className="entry-readout">
                <dt>Sacs</dt>
                <dd>{entry.bags_milled}</dd>
                <dt>Revenu</dt>
                <dd>{entry.revenue}</dd>
                <dt>Dépenses</dt>
                <dd>{entry.expenses}</dd>
                <dt>Autre</dt>
                <dd>{entry.other}</dd>
              </dl>
              {entry.notes && <p className="entry-notes">{entry.notes}</p>}
              <button
                className="secondary"
                onClick={() => startEdit(entry)}
                disabled={!navigator.onLine}
              >
                Corriger
              </button>
            </>
          )}
        </div>
      ))}
    </div>
  )
}
