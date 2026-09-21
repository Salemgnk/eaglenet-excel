import { useLiveTable } from './useLiveTable'

export interface TimeEntry {
  id: string
  employee_id: string
  clock_in: string
  clock_out: string | null
  created_at: string
}

export function useTimeEntries(siteId: string | undefined) {
  const { rows, loading } = useLiveTable<TimeEntry>(
    'time_entries',
    'id, employee_id, clock_in, clock_out, created_at',
    siteId,
  )
  return { timeEntries: rows, loading }
}
