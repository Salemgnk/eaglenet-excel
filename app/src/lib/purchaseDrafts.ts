import { openDB, type DBSchema } from 'idb'

export interface PurchaseDraft {
  id: string
  supplier_id: string
  bags_bought: number
  unit_price: number
  total_amount: number
  notes: string
  created_at: string
}

interface PurchasesDB extends DBSchema {
  purchaseDrafts: {
    key: string
    value: PurchaseDraft
  }
}

const dbPromise = openDB<PurchasesDB>('rice-mill-purchases', 1, {
  upgrade(db) {
    db.createObjectStore('purchaseDrafts', { keyPath: 'id' })
  },
})

export async function savePurchaseDraft(
  draft: Omit<PurchaseDraft, 'id' | 'created_at'>,
): Promise<PurchaseDraft> {
  const db = await dbPromise
  const entry: PurchaseDraft = {
    ...draft,
    id: crypto.randomUUID(),
    created_at: new Date().toISOString(),
  }
  await db.add('purchaseDrafts', entry)
  return entry
}

export async function listPurchaseDrafts(): Promise<PurchaseDraft[]> {
  const db = await dbPromise
  return db.getAll('purchaseDrafts')
}

export async function countPurchaseDrafts(): Promise<number> {
  const db = await dbPromise
  return db.count('purchaseDrafts')
}

export async function deletePurchaseDraft(id: string): Promise<void> {
  const db = await dbPromise
  await db.delete('purchaseDrafts', id)
}

export async function purchaseDraftExists(id: string): Promise<boolean> {
  const db = await dbPromise
  return (await db.get('purchaseDrafts', id)) !== undefined
}
