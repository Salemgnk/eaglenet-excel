import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { listDrafts, type Draft } from '../lib/drafts'
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

interface EntriesListProps {
  online: boolean
}

function friendlyErrorMessage(message: string, online: boolean): string {
  if (!online || /network|fetch/i.test(message)) {
    return 'Connexion perdue — reconnectez-vous puis réessayez.'
  }
  return message
}

type ListItem =
  | { kind: 'synced'; id: string; createdAt: string; entry: Entry }
  | { kind: 'draft'; id: string; createdAt: string; draft: Draft }

export function EntriesList({ online }: EntriesListProps) {
  const [entries, setEntries] = useState<Entry[]>([])
  const [drafts, setDrafts] = useState<Draft[]>([])
  const [loading, setLoading] = useState(true)
  const [everLoadedOnline, setEverLoadedOnline] = useState(false)
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
    setDrafts(await listDrafts())
    // Local drafts are always available offline. The server list only makes
    // sense to fetch when actually online — waiting on a fetch that can't
    // succeed just stalls the screen and, once it eventually fails, leaves
    // the operator looking at a false "no entries" state.
    if (online) {
      const { data, error } = await supabase
        .from('entries')
        .select('id, bags_milled, revenue, expenses, other, notes, created_at')
        .order('created_at', { ascending: false })
      if (!error && data) {
        setEntries(data)
        setEverLoadedOnline(true)
      }
    }
    setLoading(false)
  }

  useEffect(() => {
    loadEntries()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [online])

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
    if (!online) {
      setError(friendlyErrorMessage('', false))
      return
    }

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
      setError(friendlyErrorMessage(error.message, online))
      setSaving(false)
      return
    }

    setEditingId(null)
    setSaving(false)
    await loadEntries()
  }

  function editField(entry: Entry, name: FieldName) {
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
        <span className="field-hint">Actuellement : {entry[name]}</span>
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

  const items: ListItem[] = [
    ...entries.map(
      (entry): ListItem => ({
        kind: 'synced',
        id: entry.id,
        createdAt: entry.created_at,
        entry,
      }),
    ),
    ...drafts.map(
      (draft): ListItem => ({
        kind: 'draft',
        id: draft.id,
        createdAt: draft.created_at,
        draft,
      }),
    ),
  ].sort((a, b) => b.createdAt.localeCompare(a.createdAt))

  return (
    <div className="entries-list">
      {!online && (
        <p className="offline-note">
          {everLoadedOnline
            ? "Hors-ligne : la liste peut ne pas inclure les entrées envoyées depuis d'autres appareils, et la correction nécessite une connexion."
            : "Hors-ligne : seules les entrées enregistrées sur cet appareil et pas encore envoyées sont affichées ci-dessous."}
        </p>
      )}
      {items.length === 0 && (
        <p>
          {online
            ? "Aucune entrée envoyée pour l'instant."
            : "Aucune entrée en attente sur cet appareil."}
        </p>
      )}

      {items.map((item) =>
        item.kind === 'draft' ? (
          <div key={item.id} className="entry-card">
            <div className="entry-card-header">
              <p className="entry-date">
                {new Date(item.draft.created_at).toLocaleString('fr-FR')}
              </p>
              <span className="draft-badge">Non envoyée</span>
            </div>
            <dl className="entry-readout">
              <dt>Sacs</dt>
              <dd>{item.draft.bags_milled}</dd>
              <dt>Revenu</dt>
              <dd>{item.draft.revenue}</dd>
              <dt>Dépenses</dt>
              <dd>{item.draft.expenses}</dd>
              <dt>Autre</dt>
              <dd>{item.draft.other}</dd>
            </dl>
            {item.draft.notes && <p className="entry-notes">{item.draft.notes}</p>}
          </div>
        ) : (
          <div key={item.id} className="entry-card">
            {editingId === item.entry.id ? (
              <>
                {editField(item.entry, 'bags_milled')}
                {editField(item.entry, 'revenue')}
                {editField(item.entry, 'expenses')}
                {editField(item.entry, 'other')}
                <label>
                  Notes
                  <textarea
                    value={draftEdit.notes}
                    onChange={(e) => setDraftEdit({ ...draftEdit, notes: e.target.value })}
                  />
                </label>
                <p className="tracked-note">
                  Chaque modification est tracée : la valeur précédente reste
                  consultable.
                </p>
                {error && (
                  <p className="error" role="alert">
                    {error}
                  </p>
                )}
                <div className="edit-actions">
                  <button
                    className="primary"
                    onClick={() => saveEdit(item.entry.id)}
                    disabled={saving || !online}
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
                {!online && (
                  <p className="field-hint">
                    Hors-ligne : reconnectez-vous pour enregistrer cette correction.
                  </p>
                )}
              </>
            ) : (
              <>
                <p className="entry-date">
                  {new Date(item.entry.created_at).toLocaleString('fr-FR')}
                </p>
                <dl className="entry-readout">
                  <dt>Sacs</dt>
                  <dd>{item.entry.bags_milled}</dd>
                  <dt>Revenu</dt>
                  <dd>{item.entry.revenue}</dd>
                  <dt>Dépenses</dt>
                  <dd>{item.entry.expenses}</dd>
                  <dt>Autre</dt>
                  <dd>{item.entry.other}</dd>
                </dl>
                {item.entry.notes && <p className="entry-notes">{item.entry.notes}</p>}
                <button
                  className="secondary"
                  onClick={() => startEdit(item.entry)}
                  disabled={!online}
                >
                  Corriger
                </button>
              </>
            )}
          </div>
        ),
      )}
    </div>
  )
}
