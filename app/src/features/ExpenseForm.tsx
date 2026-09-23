import { useEffect, useRef, useState, type FormEvent } from 'react'
import { type Employee, listEmployees, refreshEmployeesCache } from '../lib/employeesCache'
import { type ExpenseCategory, saveExpenseDraft } from '../lib/expenseDrafts'
import { formatCurrency } from '../lib/format'
import { validateNumberField } from '../lib/validation'

interface ExpenseFormProps {
  siteId: string
  online: boolean
  onSaved: (draftId: string) => Promise<boolean>
}

type SavedStatus = 'local' | 'synced' | null

interface LastSaved {
  createdAt: string
  category: ExpenseCategory
  amount: number
  employeeName: string | null
  synced: boolean
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

export function ExpenseForm({ siteId, online, onSaved }: ExpenseFormProps) {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [category, setCategory] = useState<ExpenseCategory>('other')
  const [employeeId, setEmployeeId] = useState('')
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [amountError, setAmountError] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [savedStatus, setSavedStatus] = useState<SavedStatus>(null)
  const [lastSaved, setLastSaved] = useState<LastSaved | null>(null)
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  async function loadEmployees() {
    setEmployees(await listEmployees())
  }

  useEffect(() => {
    loadEmployees()
    if (online) {
      refreshEmployeesCache(siteId).then(loadEmployees)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [siteId, online])

  useEffect(() => {
    return () => {
      if (hideTimer.current) clearTimeout(hideTimer.current)
    }
  }, [])

  function showStatus(status: SavedStatus) {
    setSavedStatus(status)
    if (hideTimer.current) clearTimeout(hideTimer.current)
    hideTimer.current = setTimeout(() => setSavedStatus(null), 2000)
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()

    const amountResult = validateNumberField(amount, true)
    setAmountError(amountResult.error)
    if (amountResult.error) return

    const employeeName = employees.find((emp) => emp.id === employeeId)?.name ?? null

    setSubmitting(true)
    const draft = await saveExpenseDraft({
      category,
      amount: amountResult.value,
      employee_id: category === 'salary' && employeeId ? employeeId : null,
      description,
    })

    setCategory('other')
    setEmployeeId('')
    setAmount('')
    setDescription('')
    setAmountError(false)
    setSubmitting(false)
    showStatus('local')
    setLastSaved({
      createdAt: draft.created_at,
      category: draft.category,
      amount: amountResult.value,
      employeeName: category === 'salary' ? employeeName : null,
      synced: false,
    })

    onSaved(draft.id).then((synced) => {
      if (synced) {
        showStatus('synced')
        setLastSaved((current) =>
          current && current.createdAt === draft.created_at ? { ...current, synced: true } : current,
        )
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="entry-form" noValidate>
      <label>
        Category
        <span className="field-hint">What kind of expense this is.</span>
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
          <span className="field-hint">
            Who was paid — leave blank if they're not in the system.
          </span>
          <select value={employeeId} onChange={(e) => setEmployeeId(e.target.value)}>
            <option value="">Not in the system…</option>
            {employees.map((emp) => (
              <option key={emp.id} value={emp.id}>
                {emp.name ?? emp.email ?? emp.id}
              </option>
            ))}
          </select>
        </label>
      )}

      <label>
        Amount (GH₵)
        <span className="field-hint">How much was spent.</span>
        <input
          type="number"
          inputMode="decimal"
          min="0"
          placeholder="0.00"
          className={amountError ? 'invalid' : undefined}
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          required
        />
        {amountError && (
          <span className="field-error">
            {amount.trim() === '' ? 'Value required' : 'Must be a positive number'}
          </span>
        )}
      </label>

      <label>
        Description
        <span className="field-hint">What this was for, e.g. a part or a bill reference.</span>
        <input
          type="text"
          placeholder="e.g. ECG bill for August"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </label>

      <button type="submit" disabled={submitting}>
        {submitting ? 'Saving…' : 'Save expense'}
      </button>

      {savedStatus && (
        <p className={`saved${savedStatus === 'synced' ? ' synced' : ''}`} role="status">
          {savedStatus === 'synced' ? 'Synced ✓' : 'Saved locally ✓'}
        </p>
      )}

      {lastSaved && (
        <div className="last-saved">
          <p className="field-hint">
            Last expense {lastSaved.synced ? 'synced' : 'pending send'}:
          </p>
          <dl className="entry-readout">
            <dt>Category</dt>
            <dd>{CATEGORY_LABEL[lastSaved.category]}</dd>
            {lastSaved.employeeName && (
              <>
                <dt>Employee</dt>
                <dd>{lastSaved.employeeName}</dd>
              </>
            )}
            <dt>Amount</dt>
            <dd>{formatCurrency(lastSaved.amount)}</dd>
          </dl>
        </div>
      )}
    </form>
  )
}
