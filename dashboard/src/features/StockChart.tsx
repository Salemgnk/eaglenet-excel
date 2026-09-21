interface Point {
  date: string
  value: number
}

interface StockChartProps {
  series: Point[]
}

const WIDTH = 640
const HEIGHT = 160
const PADDING = 8

export function StockChart({ series }: StockChartProps) {
  if (series.length < 2) return null

  const values = series.map((p) => p.value)
  const min = Math.min(...values, 0)
  const max = Math.max(...values)
  const range = max - min || 1

  const stepX = (WIDTH - PADDING * 2) / (series.length - 1)
  const points = series.map((p, i) => ({
    x: PADDING + i * stepX,
    y: HEIGHT - PADDING - ((p.value - min) / range) * (HEIGHT - PADDING * 2),
  }))

  const linePath = points
    .map((pt, i) => `${i === 0 ? 'M' : 'L'} ${pt.x.toFixed(1)} ${pt.y.toFixed(1)}`)
    .join(' ')
  const last = points[points.length - 1]
  const first = points[0]
  const areaPath = `${linePath} L ${last.x.toFixed(1)} ${HEIGHT - PADDING} L ${first.x.toFixed(1)} ${HEIGHT - PADDING} Z`

  return (
    <svg
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      className="stock-chart"
      preserveAspectRatio="none"
      role="img"
      aria-label="Cumulative stock over time"
    >
      <path d={areaPath} className="stock-chart-area" />
      <path d={linePath} className="stock-chart-line" />
    </svg>
  )
}
