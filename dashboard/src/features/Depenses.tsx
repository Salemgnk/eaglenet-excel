import { useEffect, useMemo, useState } from 'react'
import { formatCurrency } from '../lib/format'
import { supabase } from '../lib/supabase'
import { type Expense, type ExpenseCategory, useExpenses } from '../lib/useExpenses'

interface DepensesProps {
  siteId: string
  userId: string
}

interface EmployeeOption {
  id: string
  name: string | null
  email: string | null
}

const CATEGORY_LABEL: Record<ExpenseCategory, string> = {
  salary: 'Salary',
  electricity: 'Electricity',
  fuel: 'Fuel',
  maintenance: 'Maintenance',
  transport: 'Transport',
  other: 'Other',
}

const CATEGORIES = Object.keys(CATEGORY_LABEL) as ExpenseCategory[]

export function Depenses({ siteId, userId }: DepensesProps) {
  const { expenses, loading } = useExpenses(siteId)
  const [employees, setEmployees] = useState<EmployeeOption[]>([])
  const [categoryFilter, setCategoryFilter] = useState<ExpenseCategory | 'all'>('all')

  const [adding, setAdding] = useState(false)
  const [category, setCategory] = useState<ExpenseCategory>('other')
  const [employeeId, setEmployeeId] = useState('')
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    supabase
      .from('profiles')
      .select('id, name, email')
      .eq('site_id', siteId)
      .in('role', ['operator', 'employee'])
      .then(({ data }) => {
        if (data) setEmployees(data)
      })
  }, [siteId])

  const employeeName = useMemo(() => {
    const byId = new Map(employees.map((e) => [e.id, e.name ?? e.email ?? 'Unnamed']))
    return (id: string | null) => (id ? (byId.get(id) ?? 'Unknown') : null)
  }, [employees])

  const totalsByCategory = useMemo(() => {
    const totals = new Map<ExpenseCategory, number>()
    for (const cat of CATEGORIES) totals.set(cat, 0)
    for (const exp of expenses) totals.set(exp.category, (totals.get(exp.category) ?? 0) + exp.amount)
    return totals
  }, [expenses])

  const grandTotal = useMemo(() => expenses.reduce((sum, e) => sum + e.amount, 0), [expenses])

  const visibleExpenses = useMemo(
    () => (categoryFilter === 'all' ? expenses : expenses.filter((e) => e.category === categoryFilter)),
    [expenses, categoryFilter],
  )

  const amountValue = Number(amount.trim())

  async function addExpense() {
    const amountValid = Number.isFinite(amountValue) && amountValue > 0
    if (!amountValid) {
      setError('Amount must be a positive number')
      return
    }
    setSaving(true)
    setError(null)
    const { error: insertError } = await supabase.from('expenses').insert({
      site_id: siteId,
      category,
      amount: amountValue,
      employee_id: category === 'salary' && employeeId ? employeeId : null,
      description: description.trim() || null,
      recorded_by: userId,
    })
    setSaving(false)
    if (insertError) {
      setError(insertError.message)
      return
    }
    setCategory('other')
    setEmployeeId('')
    setAmount('')
    setDescription('')
    setAdding(false)
  }

  if (loading) return <p className="loading">Loading…</p>

  return (
    <div className="clients-page">
      <div className="totals-band">
        <div className="totals-band-item">
          <p className="field-hint">Total</p>
          <p className="stat-readout">{formatCurrency(grandTotal)}</p>
        </div>
        {CATEGORIES.map((cat) => (
          <div className="totals-band-item" key={cat}>
            <p className="field-hint">{CATEGORY_LABEL[cat]}</p>
            <p className="stat-readout">{formatCurrency(totalsByCategory.get(cat) ?? 0)}</p>
          </div>
        ))}
      </div>

      <div className="section-header">
        <h2 className="section-title">Expenses</h2>
        <button className="secondary" onClick={() => setAdding((v) => !v)}>
          {adding ? 'Cancel' : '+ New expense'}
        </button>
      </div>

      {adding && (
        <div className="inline-form">
          <label>
            Category
            <select value={category} onChange={(e) => setCategory(e.target.value as ExpenseCategory)}>
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {CATEGORY_LABEL[cat]}
                </option>
              ))}
            </select>
          </label>
          {category === 'salary' && (
            <label>
              Employee (optional)
              <select value={employeeId} onChange={(e) => setEmployeeId(e.target.value)}>
                <option value="">Not in the system…</option>
                {employees.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.name ?? e.email ?? e.id}
                  </option>
                ))}
              </select>
            </label>
          )}
          <label>
            Amount (GH₵)
            <input type="number" min="0" value={amount} onChange={(e) => setAmount(e.target.value)} />
          </label>
          <label>
            Description
            <input
              type="text"
              placeholder="e.g. ECG bill for August"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </label>
          {error && (
            <p className="error" role="alert">
              {error}
            </p>
          )}
          <button className="primary" onClick={addExpense} disabled={saving}>
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      )}

      <div className="table-toolbar">
        <label>
          Category
          <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value as ExpenseCategory | 'all')}>
            <option value="all">All categories</option>
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {CATEGORY_LABEL[cat]}
              </option>
            ))}
          </select>
        </label>
      </div>

      {visibleExpenses.length === 0 ? (
        <p>No expenses yet.</p>
      ) : (
        <table className="entries-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Category</th>
              <th>Employee</th>
              <th className="numeric">Amount</th>
              <th>Description</th>
            </tr>
          </thead>
          <tbody>
            {visibleExpenses.map((expense: Expense) => (
              <tr key={expense.id}>
                <td>{new Date(expense.created_at).toLocaleString('en-GB')}</td>
                <td>{CATEGORY_LABEL[expense.category]}</td>
                <td>{employeeName(expense.employee_id) ?? '—'}</td>
                <td className="numeric">{formatCurrency(expense.amount)}</td>
                <td>{expense.description}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
