const currencyFormatter = new Intl.NumberFormat('en-GB', {
  style: 'currency',
  currency: 'GHS',
  currencyDisplay: 'narrowSymbol',
})

const countFormatter = new Intl.NumberFormat('en-GB')

export function formatCurrency(value: number): string {
  return currencyFormatter.format(value)
}

export function formatCount(value: number): string {
  return countFormatter.format(value)
}
