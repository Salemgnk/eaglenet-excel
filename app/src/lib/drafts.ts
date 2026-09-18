import { openDB, type DBSchema } from 'idb'

export interface Draft {
  id: string
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
