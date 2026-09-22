import { useState } from 'react'
import { supabase } from '../lib/supabase'

interface ParametresProps {
  siteId: string
}

const CONFIRM_WORD = 'SUPPRIMER'

export function Parametres({ siteId }: ParametresProps) {
  const [confirmText, setConfirmText] = useState('')
  const [clearing, setClearing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [cleared, setCleared] = useState(false)

  async function handleClear() {
    setClearing(true)
    setError(null)
    setCleared(false)
    const { error } = await supabase.rpc('clear_site_demo_data', { p_site_id: siteId })
    setClearing(false)
    if (error) {
      setError(error.message)
      return
    }
    setConfirmText('')
    setCleared(true)
  }

  return (
    <div className="clients-page">
      <div className="section-header">
        <h2 className="section-title">Settings</h2>
      </div>

      <div className="danger-zone">
        <h3>Danger zone</h3>
        <p className="field-hint">
          This permanently deletes every entry, sale, purchase, payment, client, supplier, and
          attendance record for this site. Accounts and logins are kept — only the data is
          wiped. This cannot be undone.
        </p>
        <label>
          Type {CONFIRM_WORD} to confirm
          <input
            type="text"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder={CONFIRM_WORD}
          />
        </label>
        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
        {cleared && <p className="saved">Demo data cleared.</p>}
        <button
          className="danger"
          disabled={confirmText !== CONFIRM_WORD || clearing}
          onClick={handleClear}
        >
          {clearing ? 'Clearing…' : 'Clear demo data'}
        </button>
      </div>
    </div>
  )
}
