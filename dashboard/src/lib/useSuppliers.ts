import { useLiveTable } from './useLiveTable'

export interface Supplier {
  id: string
  name: string
  contact: string | null
  created_at: string
}

export function useSuppliers(siteId: string | undefined) {
  const { rows, loading } = useLiveTable<Supplier>('suppliers', 'id, name, contact, created_at', siteId)
  return { suppliers: rows, loading }
}
