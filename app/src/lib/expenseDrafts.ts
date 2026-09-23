import { openDB, type DBSchema } from 'idb'

export type ExpenseCategory = 'salary' | 'electricity' | 'fuel' | 'maintenance' | 'transport' | 'other'

export interface ExpenseDraft {
  id: string
  category: ExpenseCategory
  amount: number
  employee_id: string | null
  description: string
  created_at: string
}

interface ExpensesDB extends DBSchema {
  expenseDrafts: {
    key: string
    value: ExpenseDraft
  }
}

const dbPromise = openDB<ExpensesDB>('rice-mill-expenses', 1, {
  upgrade(db) {
    db.createObjectStore('expenseDrafts', { keyPath: 'id' })
  },
})

export async function saveExpenseDraft(
  draft: Omit<ExpenseDraft, 'id' | 'created_at'>,
): Promise<ExpenseDraft> {
  const db = await dbPromise
  const entry: ExpenseDraft = {
    ...draft,
    id: crypto.randomUUID(),
    created_at: new Date().toISOString(),
  }
  await db.add('expenseDrafts', entry)
  return entry
}

export async function listExpenseDrafts(): Promise<ExpenseDraft[]> {
  const db = await dbPromise
  return db.getAll('expenseDrafts')
}

export async function countExpenseDrafts(): Promise<number> {
  const db = await dbPromise
  return db.count('expenseDrafts')
}

export async function deleteExpenseDraft(id: string): Promise<void> {
  const db = await dbPromise
  await db.delete('expenseDrafts', id)
}

export async function expenseDraftExists(id: string): Promise<boolean> {
  const db = await dbPromise
  return (await db.get('expenseDrafts', id)) !== undefined
}
