import { useLiveTable } from './useLiveTable'

export interface Sale {
  id: string
  client_id: string
  bags_sold: number
  unit_price: number
  total_amount: number
  notes: string | null
  created_at: string
}

export function useSales(siteId: string | undefined) {
  const { rows, loading } = useLiveTable<Sale>(
    'sales',
    'id, client_id, bags_sold, unit_price, total_amount, notes, created_at',
    siteId,
  )
  return { sales: rows, loading }
}
