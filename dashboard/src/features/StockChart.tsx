import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { formatCount } from '../lib/format'

interface Point {
  date: string
  value: number
}

interface StockChartProps {
  series: Point[]
}

export function StockChart({ series }: StockChartProps) {
  if (series.length < 2) return null

  const data = series.map((p) => ({
    date: new Date(p.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
    value: p.value,
  }))

  return (
    <ResponsiveContainer width="100%" height={200}>
      <AreaChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
        <XAxis dataKey="date" tick={{ fontSize: 11 }} />
        <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => formatCount(v)} width={60} />
        <Tooltip formatter={(value: any) => `${formatCount(Number(value))} bags`} />
        <Area
          type="monotone"
          dataKey="value"
          name="Stock"
          stroke="#10b981"
          fill="#10b981"
          fillOpacity={0.15}
          strokeWidth={2}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}
