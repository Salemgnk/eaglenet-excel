import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useLeaveRequests } from '../lib/useLeaveRequests'
import { useTimeEntries } from '../lib/useTimeEntries'

interface EmployesProps {
  siteId: string
  userId: string
}

interface EmployeeProfile {
  id: string
  role: 'operator' | 'owner' | 'employee'
  name: string | null
  email: string | null
}

const ROLE_LABEL: Record<EmployeeProfile['role'], string> = {
  operator: 'Opérateur',
  owner: 'Patron',
  employee: 'Employé',
}

function isToday(iso: string): boolean {
  const d = new Date(iso)
  const now = new Date()
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  )
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
}

export function Employes({ siteId, userId }: EmployesProps) {
  const { timeEntries, loading: timeLoading } = useTimeEntries(siteId)
  const { leaveRequests, loading: leaveLoading } = useLeaveRequests(siteId)

  const [profiles, setProfiles] = useState<EmployeeProfile[]>([])
  const [profilesLoading, setProfilesLoading] = useState(true)

  const [adding, setAdding] = useState(false)
  const [newName, setNewName] = useState('')
  const [newEmail, setNewEmail] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [createdPassword, setCreatedPassword] = useState<{ email: string; password: string } | null>(
    null,
  )

  async function loadProfiles() {
    setProfilesLoading(true)
    const { data } = await supabase
      .from('profiles')
      .select('id, role, name, email')
      .eq('site_id', siteId)
      .in('role', ['operator', 'employee'])
    if (data) setProfiles(data)
    setProfilesLoading(false)
  }

  useEffect(() => {
    loadProfiles()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [siteId])

  const todayStatus = useMemo(() => {
    const byEmployee = new Map<string, string>()
    for (const t of timeEntries) {
      if (!isToday(t.clock_in)) continue
      if (t.clock_out) {
        byEmployee.set(t.employee_id, `Sorti à ${formatTime(t.clock_out)}`)
      } else if (!byEmployee.get(t.employee_id)?.startsWith('En poste')) {
        byEmployee.set(t.employee_id, `En poste depuis ${formatTime(t.clock_in)}`)
      }
    }
    return byEmployee
  }, [timeEntries])

  const pendingLeave = useMemo(
    () => leaveRequests.filter((l) => l.status === 'pending'),
    [leaveRequests],
  )

  const employeeName = useMemo(() => {
    const byId = new Map(profiles.map((p) => [p.id, p.name ?? p.email ?? p.id.slice(0, 8)]))
    return (id: string) => byId.get(id) ?? id.slice(0, 8)
  }, [profiles])

  async function addEmployee() {
    if (!newName.trim() || !newEmail.trim()) {
      setError('Nom et email requis')
      return
    }
    setSaving(true)
    setError(null)
    const { data, error: invokeError } = await supabase.functions.invoke('create-employee', {
      body: { name: newName.trim(), email: newEmail.trim() },
    })
    setSaving(false)
    if (invokeError || data?.error) {
      setError(data?.error ?? invokeError?.message ?? 'Erreur inconnue')
      return
    }
    setCreatedPassword({ email: data.email, password: data.password })
    setNewName('')
    setNewEmail('')
    setAdding(false)
    await loadProfiles()
  }

  async function decideLeave(id: string, status: 'approved' | 'rejected') {
    await supabase
      .from('leave_requests')
      .update({ status, decided_by: userId, decided_at: new Date().toISOString() })
      .eq('id', id)
  }

  if (profilesLoading || timeLoading || leaveLoading) return <p className="loading">Chargement…</p>

  return (
    <div className="clients-page">
      <div className="section-header">
        <h2 className="section-title">Employés</h2>
        <button className="secondary" onClick={() => setAdding((v) => !v)}>
          {adding ? 'Annuler' : '+ Ajouter un employé'}
        </button>
      </div>

      {adding && (
        <div className="inline-form">
          <label>
            Nom
            <input type="text" value={newName} onChange={(e) => setNewName(e.target.value)} />
          </label>
          <label>
            Email
            <input type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} />
          </label>
          {error && (
            <p className="error" role="alert">
              {error}
            </p>
          )}
          <button className="primary" onClick={addEmployee} disabled={saving}>
            {saving ? 'Création…' : 'Créer le compte'}
          </button>
        </div>
      )}

      {createdPassword && (
        <div className="inline-form">
          <p>
            Compte créé pour <strong>{createdPassword.email}</strong>. Mot de passe temporaire
            (à communiquer à l'employé, affiché une seule fois) :
          </p>
          <p className="temp-password">{createdPassword.password}</p>
          <button className="secondary" onClick={() => setCreatedPassword(null)}>
            J'ai noté le mot de passe
          </button>
        </div>
      )}

      {profiles.length === 0 ? (
        <p>Aucun employé pour l'instant.</p>
      ) : (
        <table className="entries-table">
          <thead>
            <tr>
              <th>Nom</th>
              <th>Rôle</th>
              <th>Aujourd'hui</th>
            </tr>
          </thead>
          <tbody>
            {profiles.map((p) => (
              <tr key={p.id}>
                <td>{p.name ?? p.email ?? p.id.slice(0, 8)}</td>
                <td>{ROLE_LABEL[p.role]}</td>
                <td>{todayStatus.get(p.id) ?? 'Pas pointé aujourd\'hui'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <div className="section-header">
        <h2 className="section-title">Demandes de congé</h2>
      </div>

      {pendingLeave.length === 0 ? (
        <p>Aucune demande en attente.</p>
      ) : (
        <table className="entries-table">
          <thead>
            <tr>
              <th>Employé</th>
              <th>Date</th>
              <th>Motif</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {pendingLeave.map((l) => (
              <tr key={l.id}>
                <td>{employeeName(l.employee_id)}</td>
                <td>{new Date(l.date).toLocaleDateString('fr-FR')}</td>
                <td>{l.reason || '—'}</td>
                <td>
                  <span className="inline-payment">
                    <button className="primary" onClick={() => decideLeave(l.id, 'approved')}>
                      Approuver
                    </button>
                    <button className="secondary" onClick={() => decideLeave(l.id, 'rejected')}>
                      Refuser
                    </button>
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
