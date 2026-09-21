import { openDB, type DBSchema } from 'idb'

export interface LeaveDraft {
  id: string
  date: string
  reason: string
  created_at: string
}

interface LeaveDB extends DBSchema {
  leaveDrafts: {
    key: string
    value: LeaveDraft
  }
}

const dbPromise = openDB<LeaveDB>('rice-mill-leave', 1, {
  upgrade(db) {
    db.createObjectStore('leaveDrafts', { keyPath: 'id' })
  },
})

export async function saveLeaveDraft(
  draft: Omit<LeaveDraft, 'id' | 'created_at'>,
): Promise<LeaveDraft> {
  const db = await dbPromise
  const entry: LeaveDraft = {
    ...draft,
    id: crypto.randomUUID(),
    created_at: new Date().toISOString(),
  }
  await db.add('leaveDrafts', entry)
  return entry
}

export async function listLeaveDrafts(): Promise<LeaveDraft[]> {
  const db = await dbPromise
  return db.getAll('leaveDrafts')
}

export async function countLeaveDrafts(): Promise<number> {
  const db = await dbPromise
  return db.count('leaveDrafts')
}

export async function deleteLeaveDraft(id: string): Promise<void> {
  const db = await dbPromise
  await db.delete('leaveDrafts', id)
}
