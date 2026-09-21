import { openDB, type DBSchema } from 'idb'

export interface ShiftDraft {
  id: string
  clock_in: string
  clock_out: string | null
}

interface TimeDB extends DBSchema {
  shiftDrafts: {
    key: string
    value: ShiftDraft
  }
}

const dbPromise = openDB<TimeDB>('rice-mill-time', 1, {
  upgrade(db) {
    db.createObjectStore('shiftDrafts', { keyPath: 'id' })
  },
})

// At most one open draft (clock_out === null) should exist at a time —
// clocking in when one is already open is a UI-level guard, not enforced
// here.
export async function getOpenShiftDraft(): Promise<ShiftDraft | null> {
  const db = await dbPromise
  const all = await db.getAll('shiftDrafts')
  return all.find((d) => d.clock_out === null) ?? null
}

export async function listShiftDrafts(): Promise<ShiftDraft[]> {
  const db = await dbPromise
  return db.getAll('shiftDrafts')
}

export async function countShiftDrafts(): Promise<number> {
  const db = await dbPromise
  return db.count('shiftDrafts')
}

export async function clockIn(): Promise<ShiftDraft> {
  const db = await dbPromise
  const draft: ShiftDraft = {
    id: crypto.randomUUID(),
    clock_in: new Date().toISOString(),
    clock_out: null,
  }
  await db.put('shiftDrafts', draft)
  return draft
}

export async function clockOut(id: string): Promise<ShiftDraft | null> {
  const db = await dbPromise
  const draft = await db.get('shiftDrafts', id)
  if (!draft) return null
  const updated: ShiftDraft = { ...draft, clock_out: new Date().toISOString() }
  await db.put('shiftDrafts', updated)
  return updated
}

export async function deleteShiftDraft(id: string): Promise<void> {
  const db = await dbPromise
  await db.delete('shiftDrafts', id)
}
