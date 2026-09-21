import { openDB, type DBSchema } from 'idb'
import { supabase } from './supabase'

export interface Supplier {
  id: string
  name: string
  contact: string | null
}

interface SuppliersDB extends DBSchema {
  suppliersCache: { key: string; value: Supplier }
  pendingSuppliers: { key: string; value: Supplier }
}

const dbPromise = openDB<SuppliersDB>('rice-mill-suppliers', 1, {
  upgrade(db) {
    db.createObjectStore('suppliersCache', { keyPath: 'id' })
    db.createObjectStore('pendingSuppliers', { keyPath: 'id' })
  },
})

export async function refreshSuppliersCache(siteId: string): Promise<void> {
  const { data, error } = await supabase
    .from('suppliers')
    .select('id, name, contact')
    .eq('site_id', siteId)
    .order('name')
  if (error || !data) return

  const db = await dbPromise
  const tx = db.transaction('suppliersCache', 'readwrite')
  await tx.store.clear()
  for (const supplier of data) await tx.store.put(supplier)
  await tx.done
}

export async function listSuppliers(): Promise<Supplier[]> {
  const db = await dbPromise
  const [cached, pending] = await Promise.all([
    db.getAll('suppliersCache'),
    db.getAll('pendingSuppliers'),
  ])
  const byId = new Map(cached.map((s) => [s.id, s]))
  for (const supplier of pending) byId.set(supplier.id, supplier)
  return Array.from(byId.values()).sort((a, b) => a.name.localeCompare(b.name))
}

export async function createPendingSupplier(name: string, contact: string): Promise<Supplier> {
  const db = await dbPromise
  const supplier: Supplier = { id: crypto.randomUUID(), name, contact: contact || null }
  await db.add('pendingSuppliers', supplier)
  return supplier
}

export async function listPendingSuppliers(): Promise<Supplier[]> {
  const db = await dbPromise
  return db.getAll('pendingSuppliers')
}

export async function countPendingSuppliers(): Promise<number> {
  const db = await dbPromise
  return db.count('pendingSuppliers')
}

export async function deletePendingSupplier(id: string): Promise<void> {
  const db = await dbPromise
  await db.delete('pendingSuppliers', id)
}
