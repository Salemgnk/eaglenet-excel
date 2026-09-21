import { openDB, type DBSchema } from 'idb'
import { supabase } from './supabase'

export interface Client {
  id: string
  name: string
  contact: string | null
}

interface ClientsDB extends DBSchema {
  clientsCache: { key: string; value: Client }
  pendingClients: { key: string; value: Client }
}

const dbPromise = openDB<ClientsDB>('rice-mill-clients', 1, {
  upgrade(db) {
    db.createObjectStore('clientsCache', { keyPath: 'id' })
    db.createObjectStore('pendingClients', { keyPath: 'id' })
  },
})

// Overwrites the local read cache with the latest server list — call
// whenever online, so the next offline session has a recent client list
// to select from.
export async function refreshClientsCache(siteId: string): Promise<void> {
  const { data, error } = await supabase
    .from('clients')
    .select('id, name, contact')
    .eq('site_id', siteId)
    .order('name')
  if (error || !data) return

  const db = await dbPromise
  const tx = db.transaction('clientsCache', 'readwrite')
  await tx.store.clear()
  for (const client of data) await tx.store.put(client)
  await tx.done
}

// The cached server list plus any not-yet-synced local clients, merged
// so a client created offline is immediately selectable for a sale.
export async function listClients(): Promise<Client[]> {
  const db = await dbPromise
  const [cached, pending] = await Promise.all([
    db.getAll('clientsCache'),
    db.getAll('pendingClients'),
  ])
  const byId = new Map(cached.map((c) => [c.id, c]))
  for (const client of pending) byId.set(client.id, client)
  return Array.from(byId.values()).sort((a, b) => a.name.localeCompare(b.name))
}

export async function createPendingClient(name: string, contact: string): Promise<Client> {
  const db = await dbPromise
  const client: Client = { id: crypto.randomUUID(), name, contact: contact || null }
  await db.add('pendingClients', client)
  return client
}

export async function listPendingClients(): Promise<Client[]> {
  const db = await dbPromise
  return db.getAll('pendingClients')
}

export async function countPendingClients(): Promise<number> {
  const db = await dbPromise
  return db.count('pendingClients')
}

export async function deletePendingClient(id: string): Promise<void> {
  const db = await dbPromise
  await db.delete('pendingClients', id)
}
