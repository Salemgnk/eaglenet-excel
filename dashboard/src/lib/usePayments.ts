import { useLiveTable } from './useLiveTable'

export interface Payment {
  id: string
  client_id: string
  amount: number
  notes: string | null
  created_at: string
}

export function usePayments(siteId: string | undefined) {
  const { rows, loading } = useLiveTable<Payment>('payments', 'id, client_id, amount, notes, created_at', siteId)
  return { payments: rows, loading }
}
