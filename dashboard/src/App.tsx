import { LoginForm } from './features/LoginForm'
import { Shell } from './features/Shell'
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
    <div className="app-shell-wrapper">
      <header className="app-topbar">
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
        <Shell siteId={profile.site_id} userId={session.user.id} />
      ) : (
        <p className="error" role="alert">
          Aucun profil associé à ce compte.
        </p>
      )}
    </div>
  )
}

export default App
