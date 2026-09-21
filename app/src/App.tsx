import { useState } from 'react'
import { EntriesList } from './features/EntriesList'
import { EntryForm } from './features/EntryForm'
import { LoginForm } from './features/LoginForm'
import { PurchaseForm } from './features/PurchaseForm'
import { SaleForm } from './features/SaleForm'
import { draftExists } from './lib/drafts'
import { purchaseDraftExists } from './lib/purchaseDrafts'
import { saleDraftExists } from './lib/salesDrafts'
import { supabase } from './lib/supabase'
import { useOnlineStatus } from './lib/useOnlineStatus'
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
  const online = useOnlineStatus()
  const [tab, setTab] = useState<'new' | 'sale' | 'purchase' | 'list'>('new')

  if (sessionLoading) {
    return <p className="loading">Chargement…</p>
  }

  if (!session) {
    return <LoginForm />
  }

  async function handleSaved(draftId: string): Promise<boolean> {
    await refreshPendingCount()
    await runSync()
    return !(await draftExists(draftId))
  }

  async function handleSaleSaved(draftId: string): Promise<boolean> {
    await refreshPendingCount()
    await runSync()
    return !(await saleDraftExists(draftId))
  }

  async function handlePurchaseSaved(draftId: string): Promise<boolean> {
    await refreshPendingCount()
    await runSync()
    return !(await purchaseDraftExists(draftId))
  }

  return (
    <div className="app">
      <header className="app-header">
        <div className="brand-group">
          <span className="brand-mark">Eaglenet</span>
          <span className={`status-indicator ${online ? 'online' : 'offline'}`}>
            <span className="status-dot" />
            {online ? 'En ligne' : 'Hors ligne'}
          </span>
        </div>
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
            {pendingCount} élément{pendingCount > 1 ? 's' : ''} non envoyé
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
        <button className={tab === 'sale' ? 'active' : ''} onClick={() => setTab('sale')}>
          Vente
        </button>
        <button className={tab === 'purchase' ? 'active' : ''} onClick={() => setTab('purchase')}>
          Achat
        </button>
        <button className={tab === 'list' ? 'active' : ''} onClick={() => setTab('list')}>
          Mes entrées
        </button>
      </nav>

      {tab === 'new' && <EntryForm onSaved={handleSaved} />}
      {tab === 'sale' && profile?.site_id && (
        <SaleForm siteId={profile.site_id} online={online} onSaved={handleSaleSaved} />
      )}
      {tab === 'purchase' && profile?.site_id && (
        <PurchaseForm siteId={profile.site_id} online={online} onSaved={handlePurchaseSaved} />
      )}
      {tab === 'list' && <EntriesList online={online} />}
    </div>
  )
}

export default App
