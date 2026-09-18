import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

interface Entry {
  id: string
  bags_milled: number
  revenue: number
  expenses: number
  other: number
  notes: string | null
  created_at: string
}

export function EntriesList() {
  const [entries, setEntries] = useState<Entry[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [draftEdit, setDraftEdit] = useState<Partial<Entry>>({})
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
    setDraftEdit(entry)
    setError(null)
  }

  async function saveEdit(id: string) {
    const { error } = await supabase
      .from('entries')
      .update({
        bags_milled: Number(draftEdit.bags_milled) || 0,
        revenue: Number(draftEdit.revenue) || 0,
        expenses: Number(draftEdit.expenses) || 0,
        other: Number(draftEdit.other) || 0,
        notes: draftEdit.notes ?? null,
      })
      .eq('id', id)

    if (error) {
      setError(error.message)
      return
    }

    setEditingId(null)
    await loadEntries()
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
              <label>
                Sacs moulus
                <input
                  type="number"
                  value={draftEdit.bags_milled ?? 0}
                  onChange={(e) =>
                    setDraftEdit({ ...draftEdit, bags_milled: Number(e.target.value) })
                  }
                />
              </label>
              <label>
                Revenu
                <input
                  type="number"
                  value={draftEdit.revenue ?? 0}
                  onChange={(e) =>
                    setDraftEdit({ ...draftEdit, revenue: Number(e.target.value) })
                  }
                />
              </label>
              <label>
                Dépenses
                <input
                  type="number"
                  value={draftEdit.expenses ?? 0}
                  onChange={(e) =>
                    setDraftEdit({ ...draftEdit, expenses: Number(e.target.value) })
                  }
                />
              </label>
              <label>
                Autre
                <input
                  type="number"
                  value={draftEdit.other ?? 0}
                  onChange={(e) =>
                    setDraftEdit({ ...draftEdit, other: Number(e.target.value) })
                  }
                />
              </label>
              <label>
                Notes
                <textarea
                  value={draftEdit.notes ?? ''}
                  onChange={(e) => setDraftEdit({ ...draftEdit, notes: e.target.value })}
                />
              </label>
              {error && <p className="error">{error}</p>}
              <div className="edit-actions">
                <button onClick={() => saveEdit(entry.id)}>Enregistrer</button>
                <button className="secondary" onClick={() => setEditingId(null)}>
                  Annuler
                </button>
              </div>
            </>
          ) : (
            <>
              <p className="entry-date">
                {new Date(entry.created_at).toLocaleString('fr-FR')}
              </p>
              <p>
                Sacs: {entry.bags_milled} · Revenu: {entry.revenue} · Dépenses:{' '}
                {entry.expenses} · Autre: {entry.other}
              </p>
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
