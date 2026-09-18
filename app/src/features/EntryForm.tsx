import { useEffect, useState, type FormEvent } from 'react'
import { countDrafts, saveDraft } from '../lib/drafts'

export function EntryForm() {
  const [bagsMilled, setBagsMilled] = useState('')
  const [revenue, setRevenue] = useState('')
  const [expenses, setExpenses] = useState('')
  const [other, setOther] = useState('')
  const [notes, setNotes] = useState('')
  const [pendingCount, setPendingCount] = useState(0)
  const [savedMessage, setSavedMessage] = useState(false)

  async function refreshPendingCount() {
    setPendingCount(await countDrafts())
  }

  useEffect(() => {
    refreshPendingCount()
  }, [])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    await saveDraft({
      bags_milled: Number(bagsMilled) || 0,
      revenue: Number(revenue) || 0,
      expenses: Number(expenses) || 0,
      other: Number(other) || 0,
      notes,
    })
    setBagsMilled('')
    setRevenue('')
    setExpenses('')
    setOther('')
    setNotes('')
    await refreshPendingCount()
    setSavedMessage(true)
    setTimeout(() => setSavedMessage(false), 2000)
  }

  return (
    <div className="entry-page">
      {pendingCount > 0 && (
        <div className="pending-badge">
          {pendingCount} entrée{pendingCount > 1 ? 's' : ''} non envoyée
          {pendingCount > 1 ? 's' : ''}
        </div>
      )}
      <form onSubmit={handleSubmit} className="entry-form">
        <label>
          Sacs moulus
          <input
            type="number"
            inputMode="numeric"
            min="0"
            value={bagsMilled}
            onChange={(e) => setBagsMilled(e.target.value)}
            required
          />
        </label>
        <label>
          Revenu
          <input
            type="number"
            inputMode="decimal"
            min="0"
            step="0.01"
            value={revenue}
            onChange={(e) => setRevenue(e.target.value)}
            required
          />
        </label>
        <label>
          Dépenses
          <input
            type="number"
            inputMode="decimal"
            min="0"
            step="0.01"
            value={expenses}
            onChange={(e) => setExpenses(e.target.value)}
            required
          />
        </label>
        <label>
          Autre
          <input
            type="number"
            inputMode="decimal"
            min="0"
            step="0.01"
            value={other}
            onChange={(e) => setOther(e.target.value)}
          />
        </label>
        <label>
          Notes
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} />
        </label>
        <button type="submit">Enregistrer</button>
        {savedMessage && <p className="saved">Enregistré localement ✓</p>}
      </form>
    </div>
  )
}
