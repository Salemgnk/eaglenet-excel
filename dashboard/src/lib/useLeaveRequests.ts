import { useLiveTable } from './useLiveTable'

export type LeaveStatus = 'pending' | 'approved' | 'rejected'

export interface LeaveRequest {
  id: string
  employee_id: string
  date: string
  reason: string | null
  status: LeaveStatus
  created_at: string
}

export function useLeaveRequests(siteId: string | undefined) {
  const { rows, loading } = useLiveTable<LeaveRequest>(
    'leave_requests',
    'id, employee_id, date, reason, status, created_at',
    siteId,
  )
  return { leaveRequests: rows, loading }
}
