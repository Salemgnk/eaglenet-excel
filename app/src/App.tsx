import { useState } from 'react'
import { EntriesList } from './features/EntriesList'
import { EntryForm } from './features/EntryForm'
import { ExpenseForm } from './features/ExpenseForm'
import { LoginForm } from './features/LoginForm'
import { Pointage } from './features/Pointage'
import { PurchaseForm } from './features/PurchaseForm'
import { SaleForm } from './features/SaleForm'
import { draftExists } from './lib/drafts'
import { expenseDraftExists } from './lib/expenseDrafts'
import { purchaseDraftExists } from './lib/purchaseDrafts'
import { saleDraftExists } from './lib/salesDrafts'
import { supabase } from './lib/supabase'
import { useOnlineStatus } from './lib/useOnlineStatus'
import { useProfile } from './lib/useProfile'
import { useSession } from './lib/useSession'
import { useSync } from './lib/useSync'
import './App.css'

type Tab = 'new' | 'sale' | 'purchase' | 'expense' | 'pointage' | 'list'

// Time clock is paused pending on-site location verification — hidden from
// the tab bar for now, but the feature (Pointage, timeEntries, sync) stays
// in the codebase so it's a one-line flip once that work lands.
const TIME_CLOCK_ENABLED = false

function App() {
  const { session, loading: sessionLoading } = useSession()
  const { profile } = useProfile(session)
  const { pendingCount, syncing, syncVersion, refreshPendingCount, runSync } = useSync(
    session?.user.id,
    profile?.site_id,
  )
  const online = useOnlineStatus()
  const [tab, setTab] = useState<Tab>('new')
  const isEmployeeOnly = profile?.role === 'employee'

  if (sessionLoading) {
    return <p className="loading">Loading…</p>
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

  async function handleExpenseSaved(draftId: string): Promise<boolean> {
    await refreshPendingCount()
    await runSync()
    return !(await expenseDraftExists(draftId))
  }

  return (
    <div className="app">
      <header className="app-header">
        <div className="brand-group">
          <span className="brand-mark">Eaglenet</span>
          <span className={`status-indicator ${online ? 'online' : 'offline'}`}>
            <span className="status-dot" />
            {online ? 'Online' : 'Offline'}
          </span>
        </div>
        <div className="app-header-user">
          <span>{session.user.email}</span>
          <button className="secondary" onClick={() => supabase.auth.signOut()}>
            Sign out
          </button>
        </div>
      </header>

      {pendingCount > 0 && (
        <div className="pending-badge">
          <span>
            {online
              ? `${pendingCount} item${pendingCount > 1 ? 's' : ''} not yet sent`
              : `${pendingCount} item${pendingCount > 1 ? 's' : ''} saved — will send automatically once back online`}
          </span>
          {online && (
            <button className="link-button" onClick={runSync} disabled={syncing}>
              {syncing ? 'Sending…' : 'Retry'}
            </button>
          )}
        </div>
      )}

      {!isEmployeeOnly && (
        <nav className="tabs">
          <button className={tab === 'new' ? 'active' : ''} onClick={() => setTab('new')}>
            New entry
          </button>
          <button className={tab === 'sale' ? 'active' : ''} onClick={() => setTab('sale')}>
            Sale
          </button>
          <button className={tab === 'purchase' ? 'active' : ''} onClick={() => setTab('purchase')}>
            Purchase
          </button>
          <button className={tab === 'expense' ? 'active' : ''} onClick={() => setTab('expense')}>
            Expense
          </button>
          {TIME_CLOCK_ENABLED && (
            <button className={tab === 'pointage' ? 'active' : ''} onClick={() => setTab('pointage')}>
              Time clock
            </button>
          )}
          <button className={tab === 'list' ? 'active' : ''} onClick={() => setTab('list')}>
            My entries
          </button>
        </nav>
      )}

      {isEmployeeOnly ? (
        TIME_CLOCK_ENABLED ? (
          profile?.site_id && (
            <Pointage siteId={profile.site_id} employeeId={session.user.id} online={online} />
          )
        ) : (
          <p className="loading">Time clock is coming back soon.</p>
        )
      ) : (
        <>
          {tab === 'new' && <EntryForm onSaved={handleSaved} />}
          {tab === 'sale' && profile?.site_id && (
            <SaleForm siteId={profile.site_id} online={online} onSaved={handleSaleSaved} />
          )}
          {tab === 'purchase' && profile?.site_id && (
            <PurchaseForm siteId={profile.site_id} online={online} onSaved={handlePurchaseSaved} />
          )}
          {tab === 'expense' && profile?.site_id && (
            <ExpenseForm siteId={profile.site_id} online={online} onSaved={handleExpenseSaved} />
          )}
          {TIME_CLOCK_ENABLED && tab === 'pointage' && profile?.site_id && (
            <Pointage siteId={profile.site_id} employeeId={session.user.id} online={online} />
          )}
          {tab === 'list' && <EntriesList online={online} syncVersion={syncVersion} />}
        </>
      )}
    </div>
  )
}

export default App
