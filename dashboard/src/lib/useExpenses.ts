import { useLiveTable } from './useLiveTable'

export type ExpenseCategory = 'salary' | 'electricity' | 'fuel' | 'maintenance' | 'transport' | 'other'

export interface Expense {
  id: string
  category: ExpenseCategory
  amount: number
  employee_id: string | null
  description: string | null
  created_at: string
}

export function useExpenses(siteId: string | undefined) {
  const { rows, loading } = useLiveTable<Expense>(
    'expenses',
    'id, category, amount, employee_id, description, created_at',
    siteId,
  )
  return { expenses: rows, loading }
}
