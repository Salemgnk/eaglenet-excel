import { Dashboard } from './features/Dashboard'
import { LoginForm } from './features/LoginForm'
import { supabase } from './lib/supabase'
import { useProfile } from './lib/useProfile'
import { useSession } from './lib/useSession'
import './App.css'

function App() {
  const { session, loading: sessionLoading } = useSession()
  const { profile, loading: profileLoading } = useProfile(session)

  if (sessionLoading) {
    return <p className="loading">Chargement…</p>
  }

  if (!session) {
    return <LoginForm />
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

      {profileLoading ? (
        <p className="loading">Chargement…</p>
      ) : profile?.site_id ? (
        <Dashboard siteId={profile.site_id} />
      ) : (
        <p className="error" role="alert">
          Aucun profil associé à ce compte.
        </p>
      )}
    </div>
  )
}

export default App
