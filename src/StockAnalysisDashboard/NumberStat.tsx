import numabbr from 'numabbr'

interface NumberStatProps {
  value: number | string
  label: string
}

/**
 * Simple stat card with a large value and a label.
 * No styled-components — uses plain CSS classes from StockAnalysisDashboard.css.
 */
function NumberStat({ value, label }: NumberStatProps) {
  const formatted = typeof value === 'number' ? numabbr(value) : value

  return (
    <div className="stat-card">
      <div className="stat-card-label">{label}</div>
      <div className="stat-card-value">{formatted}</div>
    </div>
  )
}

export default NumberStat