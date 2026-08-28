import React from 'react'

interface KpiRingProps {
  label: string
  value: number
}

const KpiRing: React.FC<KpiRingProps> = ({ label, value }) => {
  // Clamp value for ring visual progress (0 to 100)
  const visualValue = Math.min(100, Math.max(0, Math.abs(value)))
  const circumference = 2 * Math.PI * 42
  const offset = circumference - (visualValue / 100) * circumference
  const isNegative = value < 0

  return (
    <div className={`kpi-ring ${isNegative ? 'negative' : ''}`} aria-label={`${label}: ${value}%`}>
      <svg viewBox="0 0 100 100" aria-hidden="true">
        <circle className="kpi-ring-track" cx="50" cy="50" r="42" />
        <circle
          className="kpi-ring-value"
          cx="50"
          cy="50"
          r="42"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          stroke={isNegative ? 'var(--red)' : 'var(--teal)'}
        />
      </svg>
      <div>
        <strong>{isNegative ? '' : '+'}{value}%</strong>
        <span>{label}</span>
      </div>
    </div>
  )
}

export default KpiRing
