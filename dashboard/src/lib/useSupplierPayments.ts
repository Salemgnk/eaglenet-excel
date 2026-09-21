import { useLiveTable } from './useLiveTable'

export interface SupplierPayment {
  id: string
  supplier_id: string
  amount: number
  notes: string | null
  created_at: string
}

export function useSupplierPayments(siteId: string | undefined) {
  const { rows, loading } = useLiveTable<SupplierPayment>(
    'supplier_payments',
    'id, supplier_id, amount, notes, created_at',
    siteId,
  )
  return { payments: rows, loading }
}
