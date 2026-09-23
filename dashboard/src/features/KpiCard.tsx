import { ArrowDown, ArrowUp } from 'lucide-react'
import { Line, LineChart, ResponsiveContainer } from 'recharts'

interface KpiCardProps {
  label: string
  value: string
  /** Percentage change vs. the previous period; omit when there's nothing to compare against (e.g. the "All" period). */
  change?: number | null
  /** Daily values for the current period, oldest first — renders as a trend sparkline when there are at least 2 points. */
  sparkline?: number[]
}

export function KpiCard({ label, value, change, sparkline }: KpiCardProps) {
  const hasChange = change !== undefined && change !== null && Number.isFinite(change)
  const isUp = hasChange && change > 0
  const isDown = hasChange && change < 0
  const sparklineData = (sparkline ?? []).map((v, i) => ({ i, v }))

  return (
    <div className="totals-band-item kpi-card">
      <div className="kpi-card-top">
        <p className="field-hint">{label}</p>
        {sparklineData.length > 1 && (
          <div className="kpi-sparkline">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={sparklineData}>
                <Line type="monotone" dataKey="v" stroke="var(--color-accent)" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
      <p className="stat-readout">{value}</p>
      {hasChange && (
        <p className={`kpi-change${isUp ? ' up' : ''}${isDown ? ' down' : ''}`}>
          {isUp && <ArrowUp size={12} strokeWidth={2.5} />}
          {isDown && <ArrowDown size={12} strokeWidth={2.5} />}
          {Math.abs(change).toFixed(1)}% vs last period
        </p>
      )}
    </div>
  )
}
