import { openDB, type DBSchema } from 'idb'
import { supabase } from './supabase'

export interface Employee {
  id: string
  name: string | null
  email: string | null
}

interface EmployeesDB extends DBSchema {
  employeesCache: { key: string; value: Employee }
}

const dbPromise = openDB<EmployeesDB>('rice-mill-employees', 1, {
  upgrade(db) {
    db.createObjectStore('employeesCache', { keyPath: 'id' })
  },
})

// Read-only cache, unlike clientsCache/suppliersCache — an operator never
// creates a profile from this app, so there's no pending-entity flow.
export async function refreshEmployeesCache(siteId: string): Promise<void> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, name, email')
    .eq('site_id', siteId)
    .in('role', ['operator', 'employee'])
  if (error || !data) return

  const db = await dbPromise
  const tx = db.transaction('employeesCache', 'readwrite')
  await tx.store.clear()
  for (const employee of data) await tx.store.put(employee)
  await tx.done
}

export async function listEmployees(): Promise<Employee[]> {
  const db = await dbPromise
  const employees = await db.getAll('employeesCache')
  return employees.sort((a, b) => (a.name ?? a.email ?? '').localeCompare(b.name ?? b.email ?? ''))
}
