import { openDB, type DBSchema } from 'idb'

export type EntryType = 'service' | 'own_production'

export interface Draft {
  id: string
  entry_type: EntryType
  bags_milled: number
  revenue: number
  expenses: number
  other: number
  notes: string
  created_at: string
}

interface RiceMillDB extends DBSchema {
  drafts: {
    key: string
    value: Draft
  }
}

const dbPromise = openDB<RiceMillDB>('rice-mill', 1, {
  upgrade(db) {
    db.createObjectStore('drafts', { keyPath: 'id' })
  },
})

export async function saveDraft(
  draft: Omit<Draft, 'id' | 'created_at'>,
): Promise<Draft> {
  const db = await dbPromise
  const entry: Draft = {
    ...draft,
    id: crypto.randomUUID(),
    created_at: new Date().toISOString(),
  }
  await db.add('drafts', entry)
  return entry
}

export async function listDrafts(): Promise<Draft[]> {
  const db = await dbPromise
  return db.getAll('drafts')
}

export async function countDrafts(): Promise<number> {
  const db = await dbPromise
  return db.count('drafts')
}

export async function deleteDraft(id: string): Promise<void> {
  const db = await dbPromise
  await db.delete('drafts', id)
}

export async function draftExists(id: string): Promise<boolean> {
  const db = await dbPromise
  return (await db.get('drafts', id)) !== undefined
}
