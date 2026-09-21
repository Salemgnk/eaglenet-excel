import { openDB, type DBSchema } from 'idb'

export interface SaleDraft {
  id: string
  client_id: string
  bags_sold: number
  unit_price: number
  total_amount: number
  notes: string
  created_at: string
}

interface SalesDB extends DBSchema {
  saleDrafts: {
    key: string
    value: SaleDraft
  }
}

const dbPromise = openDB<SalesDB>('rice-mill-sales', 1, {
  upgrade(db) {
    db.createObjectStore('saleDrafts', { keyPath: 'id' })
  },
})

export async function saveSaleDraft(
  draft: Omit<SaleDraft, 'id' | 'created_at'>,
): Promise<SaleDraft> {
  const db = await dbPromise
  const entry: SaleDraft = {
    ...draft,
    id: crypto.randomUUID(),
    created_at: new Date().toISOString(),
  }
  await db.add('saleDrafts', entry)
  return entry
}

export async function listSaleDrafts(): Promise<SaleDraft[]> {
  const db = await dbPromise
  return db.getAll('saleDrafts')
}

export async function countSaleDrafts(): Promise<number> {
  const db = await dbPromise
  return db.count('saleDrafts')
}

export async function deleteSaleDraft(id: string): Promise<void> {
  const db = await dbPromise
  await db.delete('saleDrafts', id)
}

export async function saleDraftExists(id: string): Promise<boolean> {
  const db = await dbPromise
  return (await db.get('saleDrafts', id)) !== undefined
}
