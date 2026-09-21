import { useEffect, useState, type FormEvent } from 'react'
import { clockIn, clockOut, listShiftDrafts, type ShiftDraft } from '../lib/timeEntries'
import { saveLeaveDraft } from '../lib/leaveRequests'
import { supabase } from '../lib/supabase'
import { syncPendingLeaveRequests, syncPendingShifts } from '../lib/sync'

interface PointageProps {
  siteId: string
  employeeId: string
  online: boolean
}

interface ServerShift {
  id: string
  clock_in: string
  clock_out: string | null
}

type LeaveStatus = 'pending' | 'approved' | 'rejected'

interface ServerLeave {
  id: string
  date: string
  reason: string | null
  status: LeaveStatus
}

const STATUS_LABEL: Record<LeaveStatus, string> = {
  pending: 'En attente',
  approved: 'Approuvé',
  rejected: 'Refusé',
}

const STATUS_PILL_CLASS: Record<LeaveStatus, string> = {
  pending: 'type-pill--pending',
  approved: 'type-pill--own_production',
  rejected: 'type-pill--service',
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('fr-FR')
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

export function Pointage({ siteId, employeeId, online }: PointageProps) {
  // The open shift (clocked in, not yet out) if any — regardless of
  // date, so a forgotten clock-out from a prior day still surfaces.
  const [openDraft, setOpenDraft] = useState<ShiftDraft | null>(null)
  // A shift closed today but not yet confirmed synced — without this,
  // clocking out would make the status wrongly fall back to "not
  // clocked in yet" until the server catches up.
  const [closedTodayDraft, setClosedTodayDraft] = useState<ShiftDraft | null>(null)
  const [recentShifts, setRecentShifts] = useState<ServerShift[]>([])
  const [leaveRequests, setLeaveRequests] = useState<ServerLeave[]>([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)

  const [leaveDate, setLeaveDate] = useState('')
  const [leaveReason, setLeaveReason] = useState('')
  const [leaveError, setLeaveError] = useState<string | null>(null)
  const [leaveSaved, setLeaveSaved] = useState(false)

  async function load() {
    setLoading(true)
    const drafts = await listShiftDrafts()
    setOpenDraft(drafts.find((d) => d.clock_out === null) ?? null)
    setClosedTodayDraft(drafts.find((d) => d.clock_out !== null && isToday(d.clock_in)) ?? null)
    if (online) {
      const { data: shifts } = await supabase
        .from('time_entries')
        .select('id, clock_in, clock_out')
        .eq('employee_id', employeeId)
        .order('clock_in', { ascending: false })
        .limit(10)
      if (shifts) setRecentShifts(shifts)

      const { data: leaves } = await supabase
        .from('leave_requests')
        .select('id, date, reason, status')
        .eq('employee_id', employeeId)
        .order('date', { ascending: false })
        .limit(10)
      if (leaves) setLeaveRequests(leaves)
    }
    setLoading(false)
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [employeeId, online])

  async function handleClockIn() {
    setBusy(true)
    await clockIn()
    if (online) await syncPendingShifts(employeeId, siteId)
    await load()
    setBusy(false)
  }

  async function handleClockOut() {
    if (!openDraft) return
    setBusy(true)
    await clockOut(openDraft.id)
    if (online) await syncPendingShifts(employeeId, siteId)
    await load()
    setBusy(false)
  }

  async function handleLeaveSubmit(e: FormEvent) {
    e.preventDefault()
    if (!leaveDate) {
      setLeaveError('Date requise')
      return
    }
    setLeaveError(null)
    await saveLeaveDraft({ date: leaveDate, reason: leaveReason })
    setLeaveDate('')
    setLeaveReason('')
    setLeaveSaved(true)
    setTimeout(() => setLeaveSaved(false), 2000)
    if (online) await syncPendingLeaveRequests(employeeId, siteId)
    await load()
  }

  if (loading) return <p className="loading">Chargement…</p>

  // Priority: an open shift (even from a prior day) > a shift already
  // closed today (local, maybe still syncing) > today's shift as last
  // reported by the server > nothing yet today.
  const serverTodayShift = recentShifts.find((s) => isToday(s.clock_in))
  const closedToday = closedTodayDraft ?? (serverTodayShift?.clock_out ? serverTodayShift : null)

  return (
    <div className="pointage-page">
      <div className="pointage-status">
        {openDraft ? (
          <>
            <p className="field-hint">En poste depuis</p>
            <p className="pointage-time">{formatTime(openDraft.clock_in)}</p>
            <button type="button" className="primary" onClick={handleClockOut} disabled={busy}>
              {busy ? 'Enregistrement…' : 'Pointer la sortie'}
            </button>
          </>
        ) : closedToday ? (
          <>
            <p className="field-hint">Journée terminée</p>
            <p className="pointage-time">Sorti à {formatTime(closedToday.clock_out!)}</p>
          </>
        ) : (
          <>
            <p className="field-hint">Pas encore pointé aujourd'hui</p>
            <button type="button" className="primary" onClick={handleClockIn} disabled={busy}>
              {busy ? 'Enregistrement…' : "Pointer l'arrivée"}
            </button>
          </>
        )}
      </div>

      {recentShifts.length > 0 && (
        <div className="last-saved">
          <p className="field-hint">Derniers pointages</p>
          <table className="entries-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Entrée</th>
                <th>Sortie</th>
              </tr>
            </thead>
            <tbody>
              {recentShifts.map((s) => (
                <tr key={s.id}>
                  <td>{formatDate(s.clock_in)}</td>
                  <td>{formatTime(s.clock_in)}</td>
                  <td>{s.clock_out ? formatTime(s.clock_out) : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <form onSubmit={handleLeaveSubmit} className="entry-form">
        <label>
          Demander un congé — date
          <input
            type="date"
            className={leaveError ? 'invalid' : undefined}
            value={leaveDate}
            onChange={(e) => setLeaveDate(e.target.value)}
          />
          {leaveError && <span className="field-error">{leaveError}</span>}
        </label>
        <label>
          Motif (optionnel)
          <input type="text" value={leaveReason} onChange={(e) => setLeaveReason(e.target.value)} />
        </label>
        <button type="submit">Envoyer la demande</button>
        {leaveSaved && (
          <p className="saved" role="status">
            Demande enregistrée ✓
          </p>
        )}
      </form>

      {leaveRequests.length > 0 && (
        <div className="last-saved">
          <p className="field-hint">Mes demandes de congé</p>
          {leaveRequests.map((l) => (
            <div key={l.id} className="entry-card-header">
              <span>{formatDate(l.date)}</span>
              <span className={`type-pill ${STATUS_PILL_CLASS[l.status]}`}>{STATUS_LABEL[l.status]}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
