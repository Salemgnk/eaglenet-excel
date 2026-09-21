import { useLiveTable } from './useLiveTable'

export interface Purchase {
  id: string
  supplier_id: string
  bags_bought: number
  unit_price: number
  total_amount: number
  notes: string | null
  created_at: string
}

export function usePurchases(siteId: string | undefined) {
  const { rows, loading } = useLiveTable<Purchase>(
    'purchases',
    'id, supplier_id, bags_bought, unit_price, total_amount, notes, created_at',
    siteId,
  )
  return { purchases: rows, loading }
}
