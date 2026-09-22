import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { listDrafts, type Draft, type EntryType } from '../lib/drafts'
import { formatCount, formatCurrency } from '../lib/format'
import { validateNumberField } from '../lib/validation'

interface Entry {
  id: string
  entry_type: EntryType | null
  bags_milled: number
  revenue: number
  expenses: number
  other: number
  notes: string | null
  created_at: string
}

const ENTRY_TYPE_LABEL: Record<EntryType, string> = {
  own_production: 'Own production',
  service: 'Service milling',
}

function TypeBadge({ entryType }: { entryType: EntryType | null }) {
  if (!entryType) return null
  return <span className={`type-pill type-pill--${entryType}`}>{ENTRY_TYPE_LABEL[entryType]}</span>
}

type FieldName = 'bags_milled' | 'revenue' | 'expenses' | 'other'

const REQUIRED: Record<FieldName, boolean> = {
  bags_milled: true,
  revenue: true,
  expenses: true,
  other: false,
}

const FIELD_LABELS: Record<FieldName, string> = {
  bags_milled: 'Bags milled',
  revenue: 'Revenue',
  expenses: 'Expenses',
  other: 'Other',
}

interface EditDraft {
  entry_type: EntryType | null
  bags_milled: string
  revenue: string
  expenses: string
  other: string
  notes: string
}

interface EntriesListProps {
  online: boolean
  syncVersion: number
}

function friendlyErrorMessage(message: string, online: boolean): string {
  if (!online || /network|fetch/i.test(message)) {
    return 'Connection lost — reconnect and try again.'
  }
  return message
}

function formatField(name: FieldName, value: number): string {
  return name === 'bags_milled' ? formatCount(value) : formatCurrency(value)
}

type ListItem =
  | { kind: 'synced'; id: string; createdAt: string; entry: Entry }
  | { kind: 'draft'; id: string; createdAt: string; draft: Draft }

export function EntriesList({ online, syncVersion }: EntriesListProps) {
  const [entries, setEntries] = useState<Entry[]>([])
  const [drafts, setDrafts] = useState<Draft[]>([])
  const [loading, setLoading] = useState(true)
  const [everLoadedOnline, setEverLoadedOnline] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [draftEdit, setDraftEdit] = useState<EditDraft>({
    entry_type: null,
    bags_milled: '',
    revenue: '',
    expenses: '',
    other: '',
    notes: '',
  })
  const [entryTypeError, setEntryTypeError] = useState(false)
  const [errors, setErrors] = useState<Partial<Record<FieldName, boolean>>>({})
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function loadEntries(opts: { silent?: boolean } = {}) {
    if (!opts.silent) setLoading(true)
    setDrafts(await listDrafts())
    // Local drafts are always available offline. The server list only makes
    // sense to fetch when actually online — waiting on a fetch that can't
    // succeed just stalls the screen and, once it eventually fails, leaves
    // the operator looking at a false "no entries" state.
    if (online) {
      const { data, error } = await supabase
        .from('entries')
        .select('id, entry_type, bags_milled, revenue, expenses, other, notes, created_at')
        .order('created_at', { ascending: false })
      if (!error && data) {
        setEntries(data)
        setEverLoadedOnline(true)
      }
    }
    if (!opts.silent) setLoading(false)
  }

  useEffect(() => {
    loadEntries()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [online])

  // A background sync pass just ran (e.g. auto-retry after a flaky
  // connection came back) — refresh quietly, no loading flash, so the list
  // catches up without the operator having to do anything.
  useEffect(() => {
    if (syncVersion > 0) loadEntries({ silent: true })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [syncVersion])

  function startEdit(entry: Entry) {
    setEditingId(entry.id)
    setDraftEdit({
      entry_type: entry.entry_type,
      bags_milled: String(entry.bags_milled),
      revenue: String(entry.revenue),
      expenses: String(entry.expenses),
      other: String(entry.other),
      notes: entry.notes ?? '',
    })
    setErrors({})
    setEntryTypeError(false)
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
    setEntryTypeError(!draftEdit.entry_type)
    if (hasError || !draftEdit.entry_type) return

    setSaving(true)
    const { error } = await supabase
      .from('entries')
      .update({
        entry_type: draftEdit.entry_type,
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
        <span className="field-hint">Currently: {formatField(name, entry[name])}</span>
        {errors[name] && (
          <span className="field-error">
            {draftEdit[name].trim() === ''
              ? 'Value required'
              : 'Must be a positive number'}
          </span>
        )}
      </label>
    )
  }

  if (loading) return <p className="loading">Loading…</p>

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
            ? 'Offline: the list may not include entries sent from other devices, and corrections require a connection.'
            : 'Offline: only entries saved on this device and not yet sent are shown below.'}
        </p>
      )}
      {items.length === 0 && (
        <p>{online ? 'No entries sent yet.' : 'No pending entries on this device.'}</p>
      )}

      {items.map((item) =>
        item.kind === 'draft' ? (
          <div key={item.id} className="entry-card">
            <div className="entry-card-header">
              <p className="entry-date">
                {new Date(item.draft.created_at).toLocaleString('en-GB')}
              </p>
              <span className="draft-badge">Not sent</span>
            </div>
            <TypeBadge entryType={item.draft.entry_type} />
            <dl className="entry-readout">
              <dt>Bags</dt>
              <dd>{formatCount(item.draft.bags_milled)}</dd>
              <dt>Revenue</dt>
              <dd>{formatCurrency(item.draft.revenue)}</dd>
              <dt>Expenses</dt>
              <dd>{formatCurrency(item.draft.expenses)}</dd>
              <dt>Other</dt>
              <dd>{formatCurrency(item.draft.other)}</dd>
            </dl>
            {item.draft.notes && <p className="entry-notes">{item.draft.notes}</p>}
          </div>
        ) : (
          <div key={item.id} className="entry-card">
            {editingId === item.entry.id ? (
              <>
                <div role="radiogroup" aria-label="Milling type">
                  <p className="field-hint">Milling type</p>
                  <div className="tabs entry-type-toggle">
                    <button
                      type="button"
                      role="radio"
                      aria-checked={draftEdit.entry_type === 'own_production'}
                      className={draftEdit.entry_type === 'own_production' ? 'active' : ''}
                      onClick={() => {
                        setDraftEdit({ ...draftEdit, entry_type: 'own_production' })
                        setEntryTypeError(false)
                      }}
                    >
                      Own production
                    </button>
                    <button
                      type="button"
                      role="radio"
                      aria-checked={draftEdit.entry_type === 'service'}
                      className={draftEdit.entry_type === 'service' ? 'active' : ''}
                      onClick={() => {
                        setDraftEdit({ ...draftEdit, entry_type: 'service' })
                        setEntryTypeError(false)
                      }}
                    >
                      Service milling
                    </button>
                  </div>
                  {entryTypeError && <span className="field-error">Choose a type</span>}
                </div>
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
                  Every change is tracked: the previous value stays visible.
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
                    {saving ? 'Saving…' : 'Save'}
                  </button>
                  <button
                    className="secondary"
                    onClick={() => setEditingId(null)}
                    disabled={saving}
                  >
                    Cancel
                  </button>
                </div>
                {!online && (
                  <p className="field-hint">
                    Offline: reconnect to save this correction.
                  </p>
                )}
              </>
            ) : (
              <>
                <p className="entry-date">
                  {new Date(item.entry.created_at).toLocaleString('en-GB')}
                </p>
                <TypeBadge entryType={item.entry.entry_type} />
                <dl className="entry-readout">
                  <dt>Bags</dt>
                  <dd>{formatCount(item.entry.bags_milled)}</dd>
                  <dt>Revenue</dt>
                  <dd>{formatCurrency(item.entry.revenue)}</dd>
                  <dt>Expenses</dt>
                  <dd>{formatCurrency(item.entry.expenses)}</dd>
                  <dt>Other</dt>
                  <dd>{formatCurrency(item.entry.other)}</dd>
                </dl>
                {item.entry.notes && <p className="entry-notes">{item.entry.notes}</p>}
                <button
                  className="secondary"
                  onClick={() => startEdit(item.entry)}
                  disabled={!online}
                >
                  Correct
                </button>
              </>
            )}
          </div>
        ),
      )}
    </div>
  )
}
