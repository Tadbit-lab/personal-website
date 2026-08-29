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

interface WordCloudItem {
  text: string
  value: number
  weight: number // 0.0 to 1.0
}

interface WordCloudResponse {
  symbol: string
  words: WordCloudItem[]
  article_count: number
  generated_at: number
  expires_at: number
  next_refresh_iso: string
}

/* ===========================
   KPI RING — SVG arc chart
   =========================== */

interface KpiRingProps {
  label: string
  pct: number
  display: string
  color: string
  loading: boolean
}

function KpiRing({ label, pct, display, color, loading }: KpiRingProps) {
  // Larger ring geometry so center text stays inside the arc
  const SIZE = 132
  const CX = SIZE / 2
  const CY = SIZE / 2
  const STROKE = 10
  const R = (SIZE / 2) - (STROKE / 2) - 4 // ~52
  const CIRC = 2 * Math.PI * R
  const dash = loading ? 0 : Math.max(0, Math.min(1, pct / 100)) * CIRC

  // Scale center text down for long values like "-100%" / "+24.5%"
  const raw = loading ? '…' : display
  const textLen = String(raw).length
  const fontSize = textLen >= 7 ? 16 : textLen >= 6 ? 18 : textLen >= 5 ? 20 : 22

  return (
    <div
      className="kpi-ring-card"
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        minWidth: SIZE + 8,
        overflow: 'hidden',
      }}
    >
      <svg
        className="kpi-ring-svg"
        width={SIZE}
        height={SIZE}
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        aria-label={`${label}: ${display}`}
        style={{
          width: SIZE,
          height: SIZE,
          maxWidth: '100%',
          overflow: 'visible',
          flexShrink: 0,
        }}
      >
        {/* Track */}
        <circle
          cx={CX}
          cy={CY}
          r={R}
          fill="none"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth={STROKE}
        />
        {/* Fill */}
        <circle
          cx={CX}
          cy={CY}
          r={R}
          fill="none"
          stroke={color}
          strokeWidth={STROKE}
          strokeLinecap="round"
          strokeDasharray={CIRC}
          strokeDashoffset={CIRC - dash}
          transform={`rotate(-90 ${CX} ${CY})`}
          style={{ transition: 'stroke-dashoffset 0.9s cubic-bezier(0.4,0,0.2,1)' }}
        />
        {/* Value — clipped to inner circle conceptually via smaller font + tighter centering */}
        <text
          x={CX}
          y={CY}
          textAnchor="middle"
          dominantBaseline="central"
          fill="white"
          fontSize={fontSize}
          fontWeight={700}
          fontFamily="'DM Mono', monospace"
          style={{ userSelect: 'none' }}
        >
          {raw}
        </text>
      </svg>
      <span
        className="kpi-ring-label"
        style={{
          textAlign: 'center',
          maxWidth: SIZE + 12,
          lineHeight: 1.2,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {label}
      </span>
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
  const canvasRef = useRef<HTMLCanvasElement>(null)
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
    const W = rect.width
    const H = rect.height
    const PAD = { top: 8, right: 8, bottom: 28, left: 60 }
    const cW = W - PAD.left - PAD.right
    const cH = H - PAD.top - PAD.bottom
    ctx.clearRect(0, 0, W, H)
    const min = Math.min(...values)
    const max = Math.max(...values)
    const range = max - min || 1
    const toX = (i: number) => PAD.left + (i / Math.max(values.length - 1, 1)) * cW
    const toY = (v: number) => PAD.top + cH - ((v - min) / range) * cH

    // Grid
    ctx.font = `10px 'DM Mono', monospace`
    ctx.textAlign = 'right'
    ctx.fillStyle = 'rgba(255,255,255,0.25)'
    for (let i = 0; i <= 3; i++) {
      const v = min + (range / 3) * i
      const y = toY(v)
      ctx.strokeStyle = 'rgba(255,255,255,0.04)'
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(PAD.left, y)
      ctx.lineTo(W - PAD.right, y)
      ctx.stroke()
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
      if (i === 0) ctx.moveTo(toX(i), toY(v))
      else ctx.lineTo(toX(i), toY(v))
    })
    ctx.lineTo(toX(values.length - 1), PAD.top + cH)
    ctx.lineTo(toX(0), PAD.top + cH)
    ctx.closePath()
    ctx.fillStyle = grad
    ctx.fill()

    // Line
    ctx.strokeStyle = color
    ctx.lineWidth = 2
    ctx.lineJoin = 'round'
    ctx.beginPath()
    values.forEach((v, i) => {
      if (i === 0) ctx.moveTo(toX(i), toY(v))
      else ctx.lineTo(toX(i), toY(v))
    })
    ctx.stroke()

    // Dots
    ctx.fillStyle = color
    values.forEach((v, i) => {
      ctx.beginPath()
      ctx.arc(toX(i), toY(v), 3, 0, 2 * Math.PI)
      ctx.fill()
    })
  }, [values, labels, color])

  useEffect(() => {
    draw()
  }, [draw])
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const ro = new ResizeObserver(draw)
    ro.observe(el)
    return () => ro.disconnect()
  }, [draw])

  return (
    <div ref={containerRef} style={{ width: '100%', height: `${height}px` }}>
      <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block' }} />
    </div>
  )
}

/* ===========================
   DYNAMIC WORD CLOUD (Replaces static Workforce Themes)
   =========================== */

function DynamicWordCloud({ symbol }: { symbol: string }) {
  const [data, setData] = useState<WordCloudResponse | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!symbol) return
    setLoading(true)
    const envApiUrl = (import.meta.env as any)?.VITE_API_URL
    const baseUrl = envApiUrl || ''
    fetch(`${baseUrl}/api/wordcloud/${symbol}`)
      .then((res) => res.json())
      .then((json) => {
        setData(json)
      })
      .catch((err) => console.error('Failed to load word cloud:', err))
      .finally(() => setLoading(false))
  }, [symbol])

  // Map word weight (0.0 to 1.0) to visual styles
  const getWordStyle = (weight: number) => {
    const fontSize = Math.max(12, Math.min(30, 12 + weight * 18))
    let color = 'rgba(255, 255, 255, 0.7)'
    let fontWeight = 400

    if (weight > 0.8) {
      color = '#ffffff'
      fontWeight = 700
    } else if (weight > 0.5) {
      color = 'rgba(255, 255, 255, 0.9)'
      fontWeight = 600
    } else if (weight > 0.25) {
      color = 'rgba(255, 255, 255, 0.65)'
    } else {
      color = 'rgba(255, 255, 255, 0.45)'
    }

    return { fontSize: `${fontSize}px`, color, fontWeight }
  }

  return (
    <div className="workforce-themes-card" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ marginBottom: '8px' }}>
        <span
          style={{
            fontSize: '0.6875rem',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: '#63d6ad',
            fontWeight: 700,
            display: 'block',
          }}
        >
          NEWS & MARKET THEMES
        </span>
        <h4 className="info-section-title" style={{ margin: 0 }}>
          Trending themes
        </h4>
      </div>

      <div
        style={{
          flex: 1,
          display: 'flex',
          flexWrap: 'wrap',
          alignContent: 'center',
          justifyContent: 'center',
          alignItems: 'center',
          gap: '6px 12px',
          padding: '8px',
          textAlign: 'center',
          overflow: 'hidden',
        }}
      >
        {loading ? (
          <span style={{ fontSize: '0.8125rem', color: 'rgba(255, 255, 255, 0.4)' }}>
            Analyzing market themes…
          </span>
        ) : !data?.words?.length ? (
          <span style={{ fontSize: '0.8125rem', color: 'rgba(255, 255, 255, 0.4)' }}>
            No recent news themes found for {symbol}.
          </span>
        ) : (
          data.words.slice(0, 15).map((item) => {
            const style = getWordStyle(item.weight)
            return (
              <span
                key={item.text}
                title={`${item.text}: ${item.value} mentions`}
                style={{
                  ...style,
                  fontFamily: "'Inter', sans-serif",
                  lineHeight: '1.2',
                  transition: 'transform 0.2s ease',
                  cursor: 'default',
                  userSelect: 'none',
                  textTransform: 'capitalize',
                }}
              >
                {item.text.charAt(0).toUpperCase() + item.text.slice(1)}
              </span>
            )
          })
        )}
      </div>
    </div>
  )
}

/* ===========================
   VALUATION TABLE
   =========================== */

function ValuationTable({ data }: { data: ValuationData | null }) {
  const rows: { label: string; key: keyof ValuationData; fmt?: (v: number) => string }[] = [
    { label: 'P/E Ratio', key: 'pe', fmt: (v) => v.toFixed(1) },
    { label: 'P/B Ratio', key: 'pb', fmt: (v) => v.toFixed(2) },
    { label: 'P/S Ratio', key: 'ps', fmt: (v) => v.toFixed(2) },
    { label: 'EV / EBITDA', key: 'ev_ebitda', fmt: (v) => v.toFixed(1) },
    { label: 'PEG Ratio', key: 'peg', fmt: (v) => v.toFixed(2) },
    { label: 'Enterprise Val', key: 'enterprise_value', fmt: (v) => `$${numabbr(v)}` },
  ]

  return (
    <div className="valuation-table">
      {rows.map(({ label, key, fmt }) => {
        const raw = data?.[key]
        const val =
          raw != null && typeof raw === 'number' && fmt
            ? fmt(raw)
            : raw != null
              ? String(raw)
              : '—'
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
    parts.push(
      `Profit margin stands at ${(fund.profit_margin * 100).toFixed(1)}%, reflecting ${fund.profit_margin > 0.2 ? 'strong' : 'moderate'
      } pricing power.`
    )
  if (fund?.roe != null)
    parts.push(
      `Return on equity of ${(fund.roe * 100).toFixed(1)}% indicates ${fund.roe > 0.15 ? 'efficient' : 'below-average'
      } capital utilization.`
    )
  if (income?.revenue?.length) {
    const rev = income.revenue
    const last = rev[rev.length - 1]
    const prev = rev[rev.length - 2]
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
   MAIN COMPONENT
   =========================== */

function CompanyInfoView({ symbol, basicInfo }: CompanyInfoViewProps) {
  const [fund, setFund] = useState<FundamentalsData | null>(null)
  const [income, setIncome] = useState<IncomeData | null>(null)
  const [val, setVal] = useState<ValuationData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    Promise.allSettled([
      fetchFundamentals(symbol),
      fetchIncome(symbol),
      fetchValuation(symbol),
    ]).then(([fundRes, incRes, valRes]) => {
      if (fundRes.status === 'fulfilled') setFund(fundRes.value)
      if (incRes.status === 'fulfilled') setIncome(incRes.value)
      if (valRes.status === 'fulfilled') setVal(valRes.value)
      setLoading(false)
    })
  }, [symbol])

  /* ---- KPI ring data ---- */
  const revGrowth = fund?.revenue_growth_yoy ?? null
  const epsGrowth = fund?.eps_growth_yoy ?? null
  const margin = fund?.profit_margin ?? null
  const roe = fund?.roe ?? null

  const toRingPct = (v: number | null, max = 50) =>
    v == null ? 0 : Math.max(0, Math.min(100, ((v * 100) / max) * 100))

  const kpis: Omit<KpiRingProps, 'loading'>[] = [
    {
      label: 'Revenue Growth',
      pct: toRingPct(revGrowth, 50),
      display: revGrowth != null ? `${(revGrowth * 100).toFixed(1)}%` : '—',
      color: '#63d6ad',
    },
    {
      label: 'EPS Growth',
      pct: toRingPct(epsGrowth, 50),
      display: epsGrowth != null ? `${(epsGrowth * 100).toFixed(1)}%` : '—',
      color: '#7c6af7',
    },
    {
      label: 'Profit Margin',
      pct: margin != null ? Math.max(0, Math.min(100, margin * 100 * 2)) : 0,
      display: margin != null ? `${(margin * 100).toFixed(1)}%` : '—',
      color: '#f59e0b',
    },
    {
      label: 'ROE',
      pct: toRingPct(roe, 40),
      display: roe != null ? `${(roe * 100).toFixed(1)}%` : '—',
      color: '#38bdf8',
    },
  ]

  /* ---- Sparkline data ---- */
  const revValues = income?.revenue ?? []
  const revLabels = income?.years ?? []
  const niValues = income?.net_income ?? []

  return (
    <div className="company-info-view">
      {/* TOP ROW: KPI Rings (Left) + Live Word Cloud (Right) */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '20px',
          alignItems: 'stretch',
        }}
      >
        {/* Left: Growth Indicators */}
        <section className="info-section" style={{ margin: 0 }}>
          <h4 className="info-section-title">Growth Indicators (TTM)</h4>
          <div
            className="kpi-ring-grid"
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, minmax(140px, 1fr))',
              gap: '16px 12px',
              alignItems: 'start',
              justifyItems: 'center',
              width: '100%',
              overflow: 'hidden',
            }}
          >
            {kpis.map((k) => (
              <KpiRing key={k.label} {...k} loading={loading} />
            ))}
          </div>
        </section>

        {/* Right: Dynamic Word Cloud */}
        <section className="info-section" style={{ margin: 0 }}>
          <DynamicWordCloud symbol={symbol} />
        </section>
      </div>

      {/* Revenue history */}
      {(revValues.length > 0 || loading) && (
        <section className="info-section" style={{ marginTop: '20px' }}>
          <h4 className="info-section-title">Annual Revenue</h4>
          <div className="stock-chart-container" style={{ height: '160px', marginBottom: 0 }}>
            {loading ? (
              <div className="chart-loading-overlay">
                <div className="stock-spinner" />
              </div>
            ) : (
              <Sparkline values={revValues} labels={revLabels} color="#63d6ad" height={160} />
            )}
          </div>
        </section>
      )}

      {/* Net income trend */}
      {(niValues.length > 0 || loading) && (
        <section className="info-section">
          <h4 className="info-section-title">Net Profit Trend</h4>
          <div className="stock-chart-container" style={{ height: '160px', marginBottom: 0 }}>
            {loading ? (
              <div className="chart-loading-overlay">
                <div className="stock-spinner" />
              </div>
            ) : (
              <Sparkline values={niValues} labels={revLabels} color="#7c6af7" height={160} />
            )}
          </div>
        </section>
      )}

      {/* Valuation */}
      <section className="info-section">
        <h4 className="info-section-title">Valuation Multiples</h4>
        {loading ? (
          <div style={{ color: 'var(--text-muted)', fontSize: '0.8125rem' }}>Loading…</div>
        ) : (
          <ValuationTable data={val} />
        )}
      </section>

      {/* Financial summary */}
      {!loading && <FinancialSummary fund={fund} income={income} />}

      {/* Fallback: show basicInfo if defeatbeta returned nothing */}
      {!loading && !fund && basicInfo && (
        <section className="info-section">
          <h4 className="info-section-title">Company Profile</h4>
          <div className="valuation-table">
            {Object.entries(basicInfo)
              .slice(0, 10)
              .map(([k, v]) => (
                <div key={k} className="valuation-row">
                  <span className="valuation-label">{k}</span>
                  <span className="valuation-value">
                    {typeof v === 'number' ? numabbr(v) : String(v ?? '—')}
                  </span>
                </div>
              ))}
          </div>
        </section>
      )}
    </div>
  )
}

export default CompanyInfoView