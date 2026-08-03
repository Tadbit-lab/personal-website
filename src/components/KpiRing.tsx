interface KpiRingProps {
  label: string
  value: number
}

function KpiRing({ label, value }: KpiRingProps) {
  const normalized = Math.min(100, Math.max(0, value))
  const circumference = 2 * Math.PI * 42
  const offset = circumference - (normalized / 100) * circumference

  return (
    <div className="kpi-ring" aria-label={`${label}: ${normalized}%`}>
      <svg viewBox="0 0 100 100" aria-hidden="true">
        <circle className="kpi-ring-track" cx="50" cy="50" r="42" />
        <circle
          className="kpi-ring-value"
          cx="50"
          cy="50"
          r="42"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      <div><strong>{normalized}%</strong><span>{label}</span></div>
    </div>
  )
}

export default KpiRing
