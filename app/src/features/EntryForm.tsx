import { useState, type FormEvent } from 'react'
import { saveDraft } from '../lib/drafts'

interface EntryFormProps {
  onSaved: () => void
}

export function EntryForm({ onSaved }: EntryFormProps) {
  const [bagsMilled, setBagsMilled] = useState('')
  const [revenue, setRevenue] = useState('')
  const [expenses, setExpenses] = useState('')
  const [other, setOther] = useState('')
  const [notes, setNotes] = useState('')
  const [savedMessage, setSavedMessage] = useState(false)

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
    onSaved()
    setSavedMessage(true)
    setTimeout(() => setSavedMessage(false), 2000)
  }

  return (
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
  )
}
