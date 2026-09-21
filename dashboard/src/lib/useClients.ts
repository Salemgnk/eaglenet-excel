import { useLiveTable } from './useLiveTable'

export interface Client {
  id: string
  name: string
  contact: string | null
  created_at: string
}

export function useClients(siteId: string | undefined) {
  const { rows, loading } = useLiveTable<Client>('clients', 'id, name, contact, created_at', siteId)
  return { clients: rows, loading }
}
