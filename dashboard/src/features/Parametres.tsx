import { useState, type FormEvent } from 'react'
import { supabase } from '../lib/supabase'

interface ParametresProps {
  siteId: string
}

const CONFIRM_WORD = 'DELETE'

export function Parametres({ siteId }: ParametresProps) {
  const [confirmText, setConfirmText] = useState('')
  const [clearing, setClearing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [cleared, setCleared] = useState(false)

  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordSaving, setPasswordSaving] = useState(false)
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [passwordChanged, setPasswordChanged] = useState(false)

  async function handleChangePassword(e: FormEvent) {
    e.preventDefault()
    setPasswordChanged(false)
    const trimmed = newPassword.trim()
    if (trimmed.length < 8) {
      setPasswordError('Password must be at least 8 characters')
      return
    }
    if (trimmed !== confirmPassword.trim()) {
      setPasswordError('Passwords do not match')
      return
    }
    setPasswordSaving(true)
    setPasswordError(null)
    const { error } = await supabase.auth.updateUser({ password: trimmed })
    setPasswordSaving(false)
    if (error) {
      setPasswordError(error.message)
      return
    }
    setNewPassword('')
    setConfirmPassword('')
    setPasswordChanged(true)
  }

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

      <form className="inline-form" onSubmit={handleChangePassword}>
        <h3>Change my password</h3>
        <label>
          New password
          <input
            type="password"
            autoComplete="new-password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
          />
        </label>
        <label>
          Confirm password
          <input
            type="password"
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
        </label>
        {passwordError && (
          <p className="error" role="alert">
            {passwordError}
          </p>
        )}
        {passwordChanged && <p className="saved">Password updated.</p>}
        <button className="primary" type="submit" disabled={passwordSaving}>
          {passwordSaving ? 'Saving…' : 'Update password'}
        </button>
      </form>

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
