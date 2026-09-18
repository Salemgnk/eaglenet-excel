import { EntryForm } from './features/EntryForm'
import { LoginForm } from './features/LoginForm'
import { supabase } from './lib/supabase'
import { useSession } from './lib/useSession'
import './App.css'

function App() {
  const { session, loading } = useSession()

  if (loading) {
    return <p className="loading">Chargement…</p>
  }

  if (!session) {
    return <LoginForm />
  }

  return (
    <div className="app">
      <header className="app-header">
        <span>{session.user.email}</span>
        <button onClick={() => supabase.auth.signOut()}>Déconnexion</button>
      </header>
      <EntryForm />
    </div>
  )
}

export default App
