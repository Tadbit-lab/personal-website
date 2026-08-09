import { useState, useEffect, useRef, useCallback } from 'react'
import numabbr from 'numabbr'
import {
  fetchFundamentals,
  fetchIncome,
  fetchValuation,
  type FundamentalsData,
  type IncomeData,
  type ValuationData,
} from './defeatbetaClient'

/* ===========================
   TYPES
   =========================== */

interface CompanyInfoViewProps {
  symbol: string
  /** basicInfo from existing analyzeStock() — used for name/sector fallback */
  basicInfo?: Record<string, any>
}

/* ===========================
   KPI RING — SVG arc chart
   =========================== */

interface KpiRingProps {
  label: string
  /** Value 0-100 for ring fill. */
  pct: number
  /** Display string in centre */
  display: string
  color: string
  loading: boolean
}

function KpiRing({ label, pct, display, color, loading }: KpiRingProps) {
  const R = 40
  const CIRC = 2 * Math.PI * R
  const dash = loading ? 0 : Math.max(0, Math.min(1, pct / 100)) * CIRC

  return (
    <div className="kpi-ring-card">
      <svg className="kpi-ring-svg" viewBox="0 0 100 100" aria-label={`${label}: ${display}`}>
        {/* Track */}
        <circle
          cx="50" cy="50" r={R}
          fill="none"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth="8"
        />
        {/* Fill */}
        <circle
          cx="50" cy="50" r={R}
          fill="none"
          stroke={color}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={CIRC}
          strokeDashoffset={CIRC - dash}
          transform="rotate(-90 50 50)"
          style={{ transition: 'stroke-dashoffset 0.9s cubic-bezier(0.4,0,0.2,1)' }}
        />
        {/* Value */}
        <text x="50" y="50" textAnchor="middle" dominantBaseline="central"
          fill="white" fontSize="14" fontWeight="700" fontFamily="'DM Mono', monospace">
          {loading ? '…' : display}
        </text>
      </svg>
      <span className="kpi-ring-label">{label}</span>
    </div>
  )
}

/* ===========================
   MINI SPARKLINE — canvas
   =========================== */

interface SparklineProps {
  values: number[]
  labels: string[]
  color: string
  height?: number
}

function Sparkline({ values, labels, color, height = 120 }: SparklineProps) {
  const canvasRef    = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas || !values.length) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const dpr = window.devicePixelRatio || 1
    const rect = canvas.getBoundingClientRect()
    canvas.width = rect.width * dpr
    canvas.height = rect.height * dpr
    ctx.scale(dpr, dpr)
    const W = rect.width; const H = rect.height
    const PAD = { top: 8, right: 8, bottom: 28, left: 60 }
    const cW = W - PAD.left - PAD.right; const cH = H - PAD.top - PAD.bottom
    ctx.clearRect(0, 0, W, H)
    const min = Math.min(...values); const max = Math.max(...values)
    const range = max - min || 1
    const toX = (i: number) => PAD.left + (i / Math.max(values.length - 1, 1)) * cW
    const toY = (v: number) => PAD.top + cH - ((v - min) / range) * cH

    // Grid
    ctx.font = `10px 'DM Mono', monospace`
    ctx.textAlign = 'right'
    ctx.fillStyle = 'rgba(255,255,255,0.25)'
    for (let i = 0; i <= 3; i++) {
      const v = min + (range / 3) * i; const y = toY(v)
      ctx.strokeStyle = 'rgba(255,255,255,0.04)'; ctx.lineWidth = 1
      ctx.beginPath(); ctx.moveTo(PAD.left, y); ctx.lineTo(W - PAD.right, y); ctx.stroke()
      ctx.fillText(numabbr(v), PAD.left - 4, y + 3)
    }

    // X labels
    ctx.textAlign = 'center'
    ctx.fillStyle = 'rgba(255,255,255,0.25)'
    for (let i = 0; i < values.length; i++) {
      ctx.fillText(labels[i] ?? '', toX(i), H - 6)
    }

    // Area fill
    const grad = ctx.createLinearGradient(0, PAD.top, 0, PAD.top + cH)
    grad.addColorStop(0, `${color}44`)
    grad.addColorStop(1, `${color}00`)
    ctx.beginPath()
    values.forEach((v, i) => {
      if (i === 0) ctx.moveTo(toX(i), toY(v)); else ctx.lineTo(toX(i), toY(v))
    })
    ctx.lineTo(toX(values.length - 1), PAD.top + cH)
    ctx.lineTo(toX(0), PAD.top + cH)
    ctx.closePath()
    ctx.fillStyle = grad
    ctx.fill()

    // Line
    ctx.strokeStyle = color; ctx.lineWidth = 2; ctx.lineJoin = 'round'
    ctx.beginPath()
    values.forEach((v, i) => {
      if (i === 0) ctx.moveTo(toX(i), toY(v)); else ctx.lineTo(toX(i), toY(v))
    })
    ctx.stroke()

    // Dots
    ctx.fillStyle = color
    values.forEach((v, i) => {
      ctx.beginPath(); ctx.arc(toX(i), toY(v), 3, 0, 2 * Math.PI); ctx.fill()
    })
  }, [values, labels, color])

  useEffect(() => { draw() }, [draw])
  useEffect(() => {
    const el = containerRef.current; if (!el) return
    const ro = new ResizeObserver(draw); ro.observe(el)
    return () => ro.disconnect()
  }, [draw])

  return (
    <div ref={containerRef} style={{ width: '100%', height: `${height}px` }}>
      <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block' }} />
    </div>
  )
}

/* ===========================
   VALUATION TABLE
   =========================== */

function ValuationTable({ data }: { data: ValuationData | null }) {
  const rows: { label: string; key: keyof ValuationData; fmt?: (v: number) => string }[] = [
    { label: 'P/E Ratio',    key: 'pe',               fmt: (v) => v.toFixed(1) },
    { label: 'P/B Ratio',    key: 'pb',               fmt: (v) => v.toFixed(2) },
    { label: 'P/S Ratio',    key: 'ps',               fmt: (v) => v.toFixed(2) },
    { label: 'EV / EBITDA',  key: 'ev_ebitda',        fmt: (v) => v.toFixed(1) },
    { label: 'PEG Ratio',    key: 'peg',              fmt: (v) => v.toFixed(2) },
    { label: 'Enterprise Val', key: 'enterprise_value', fmt: (v) => `$${numabbr(v)}` },
  ]

  return (
    <div className="valuation-table">
      {rows.map(({ label, key, fmt }) => {
        const raw = data?.[key]
        const val = (raw != null && typeof raw === 'number' && fmt) ? fmt(raw) : (raw != null ? String(raw) : '—')
        return (
          <div key={label} className="valuation-row">
            <span className="valuation-label">{label}</span>
            <span className="valuation-value">{val}</span>
          </div>
        )
      })}
    </div>
  )
}

/* ===========================
   FINANCIAL SUMMARY
   =========================== */

function FinancialSummary({ fund, income }: { fund: FundamentalsData | null; income: IncomeData | null }) {
  if (!fund && !income) return null

  const parts: string[] = []
  if (fund?.name) parts.push(`${fund.name} operates in the ${fund.sector ?? 'technology'} sector.`)
  if (fund?.profit_margin != null)
    parts.push(`Profit margin stands at ${(fund.profit_margin * 100).toFixed(1)}%, reflecting ${fund.profit_margin > 0.2 ? 'strong' : 'moderate'} pricing power.`)
  if (fund?.roe != null)
    parts.push(`Return on equity of ${(fund.roe * 100).toFixed(1)}% indicates ${fund.roe > 0.15 ? 'efficient' : 'below-average'} capital utilization.`)
  if (income?.revenue?.length) {
    const rev = income.revenue
    const last = rev[rev.length - 1]; const prev = rev[rev.length - 2]
    if (prev && last) {
      const g = ((last - prev) / Math.abs(prev)) * 100
      parts.push(`Revenue grew ${g >= 0 ? '+' : ''}${g.toFixed(1)}% year-over-year to $${numabbr(last)}.`)
    }
  }

  if (!parts.length) return null

  return (
    <div className="financial-summary-block">
      <h4 className="info-section-title">Financial Overview</h4>
      <p className="financial-summary-text">{parts.join(' ')}</p>
    </div>
  )
}

/* ===========================
   COMPONENT
   =========================== */

function CompanyInfoView({ symbol, basicInfo }: CompanyInfoViewProps) {
  const [fund, setFund]     = useState<FundamentalsData | null>(null)
  const [income, setIncome] = useState<IncomeData | null>(null)
  const [val, setVal]       = useState<ValuationData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    Promise.allSettled([
      fetchFundamentals(symbol),
      fetchIncome(symbol),
      fetchValuation(symbol),
    ]).then(([fundRes, incRes, valRes]) => {
      if (fundRes.status === 'fulfilled') setFund(fundRes.value)
      if (incRes.status  === 'fulfilled') setIncome(incRes.value)
      if (valRes.status  === 'fulfilled') setVal(valRes.value)
      setLoading(false)
    })
  }, [symbol])

  /* ---- KPI ring data ---- */
  const revGrowth  = fund?.revenue_growth_yoy ?? null   // e.g. 0.12 → 12%
  const epsGrowth  = fund?.eps_growth_yoy     ?? null
  const margin     = fund?.profit_margin      ?? null
  const roe        = fund?.roe                ?? null

  const toRingPct = (v: number | null, max = 50) =>
    v == null ? 0 : Math.max(0, Math.min(100, (v * 100) / max * 100))

  const kpis: Omit<KpiRingProps, 'loading'>[] = [
    {
      label: 'Revenue Growth',
      pct:  toRingPct(revGrowth, 50),
      display: revGrowth != null ? `${(revGrowth * 100).toFixed(1)}%` : '—',
      color: '#63d6ad',
    },
    {
      label: 'EPS Growth',
      pct:  toRingPct(epsGrowth, 50),
      display: epsGrowth != null ? `${(epsGrowth * 100).toFixed(1)}%` : '—',
      color: '#7c6af7',
    },
    {
      label: 'Profit Margin',
      pct:  margin != null ? Math.max(0, Math.min(100, margin * 100 * 2)) : 0,
      display: margin != null ? `${(margin * 100).toFixed(1)}%` : '—',
      color: '#f59e0b',
    },
    {
      label: 'ROE',
      pct:  toRingPct(roe, 40),
      display: roe != null ? `${(roe * 100).toFixed(1)}%` : '—',
      color: '#38bdf8',
    },
  ]

  /* ---- Sparkline data ---- */
  const revValues = income?.revenue ?? []
  const revLabels = income?.years   ?? []
  const niValues  = income?.net_income ?? []

  return (
    <div className="company-info-view">
      {/* KPI rings */}
      <section className="info-section">
        <h4 className="info-section-title">Key Performance Indicators</h4>
        <div className="kpi-ring-grid">
          {kpis.map((k) => (
            <KpiRing key={k.label} {...k} loading={loading} />
          ))}
        </div>
      </section>

      {/* Revenue history */}
      {(revValues.length > 0 || loading) && (
        <section className="info-section">
          <h4 className="info-section-title">Revenue History</h4>
          <div className="stock-chart-container" style={{ height: '160px', marginBottom: 0 }}>
            {loading
              ? <div className="chart-loading-overlay"><div className="stock-spinner" /></div>
              : <Sparkline values={revValues} labels={revLabels} color="#63d6ad" height={160} />
            }
          </div>
        </section>
      )}

      {/* Net income trend */}
      {(niValues.length > 0 || loading) && (
        <section className="info-section">
          <h4 className="info-section-title">Net Income Trend</h4>
          <div className="stock-chart-container" style={{ height: '160px', marginBottom: 0 }}>
            {loading
              ? <div className="chart-loading-overlay"><div className="stock-spinner" /></div>
              : <Sparkline values={niValues} labels={revLabels} color="#7c6af7" height={160} />
            }
          </div>
        </section>
      )}

      {/* Valuation */}
      <section className="info-section">
        <h4 className="info-section-title">Valuation Multiples</h4>
        {loading
          ? <div style={{ color: 'var(--text-muted)', fontSize: '0.8125rem' }}>Loading…</div>
          : <ValuationTable data={val} />
        }
      </section>

      {/* Financial summary */}
      {!loading && <FinancialSummary fund={fund} income={income} />}

      {/* Fallback: show basicInfo if defeatbeta returned nothing */}
      {!loading && !fund && basicInfo && (
        <section className="info-section">
          <h4 className="info-section-title">Company Profile</h4>
          <div className="valuation-table">
            {Object.entries(basicInfo).slice(0, 10).map(([k, v]) => (
              <div key={k} className="valuation-row">
                <span className="valuation-label">{k}</span>
                <span className="valuation-value">{typeof v === 'number' ? numabbr(v) : String(v ?? '—')}</span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

export default CompanyInfoView
