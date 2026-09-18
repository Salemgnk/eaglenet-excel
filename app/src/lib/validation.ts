export interface NumberFieldResult {
  value: number
  error: boolean
}

/**
 * A field left empty is only an error when required — but a negative or
 * non-numeric value is always an error, required or not. Never silently
 * coerces bad input to 0; the caller decides what to do with `error`.
 */
export function validateNumberField(raw: string, required: boolean): NumberFieldResult {
  const trimmed = raw.trim()
  if (trimmed === '') {
    return { value: 0, error: required }
  }
  const parsed = Number(trimmed)
  if (!Number.isFinite(parsed) || parsed < 0) {
    return { value: 0, error: true }
  }
  return { value: parsed, error: false }
}
