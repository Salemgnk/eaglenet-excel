import { useState } from 'react'
import { EntriesList } from './features/EntriesList'
import { EntryForm } from './features/EntryForm'
import { LoginForm } from './features/LoginForm'
import { supabase } from './lib/supabase'
import { useProfile } from './lib/useProfile'
import { useSession } from './lib/useSession'
import { useSync } from './lib/useSync'
import './App.css'

function App() {
  const { session, loading: sessionLoading } = useSession()
  const { profile } = useProfile(session)
  const { pendingCount, syncing, refreshPendingCount, runSync } = useSync(
    session?.user.id,
    profile?.site_id,
  )
  const [tab, setTab] = useState<'new' | 'list'>('new')

  if (sessionLoading) {
    return <p className="loading">Chargement…</p>
  }

  if (!session) {
    return <LoginForm />
  }

  async function handleSaved() {
    await refreshPendingCount()
    runSync()
  }

  return (
    <div className="app">
      <header className="app-header">
        <span className="brand-mark">Eaglenet</span>
        <div className="app-header-user">
          <span>{session.user.email}</span>
          <button className="secondary" onClick={() => supabase.auth.signOut()}>
            Déconnexion
          </button>
        </div>
      </header>

      {pendingCount > 0 && (
        <div className="pending-badge">
          <span>
            {pendingCount} entrée{pendingCount > 1 ? 's' : ''} non envoyée
            {pendingCount > 1 ? 's' : ''}
          </span>
          <button className="link-button" onClick={runSync} disabled={syncing}>
            {syncing ? 'Envoi…' : 'Réessayer'}
          </button>
        </div>
      )}

      <nav className="tabs">
        <button className={tab === 'new' ? 'active' : ''} onClick={() => setTab('new')}>
          Nouvelle entrée
        </button>
        <button className={tab === 'list' ? 'active' : ''} onClick={() => setTab('list')}>
          Mes entrées
        </button>
      </nav>

      {tab === 'new' ? <EntryForm onSaved={handleSaved} /> : <EntriesList />}
    </div>
  )
}

export default App
