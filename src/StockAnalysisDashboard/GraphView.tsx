import { useState, useEffect, useRef, useCallback } from 'react'
import { PrimaryColor } from './StockAnalysisDashboard'
import {
  fetchCandles,
  type CandleData,
  type Timeframe,
} from './defeatbetaClient'

/* ===========================
   TYPES
   =========================== */

interface GraphViewProps {
  symbol: string
  /** Legacy price history from analyzeStock — used as fallback if candles fail. */
  priceHistoryFallback?: { date: string[]; price: number[] } | null
}

/* ===========================
   CHART DRAW — OHLCV CANDLESTICK
   =========================== */

function drawCandleChart(
  canvas: HTMLCanvasElement,
  candles: CandleData,
  accentColor: string
) {
  const ctx = canvas.getContext('2d')
  if (!ctx || !candles.c.length) return

  const dpr = window.devicePixelRatio || 1
  const rect = canvas.getBoundingClientRect()
  canvas.width = rect.width * dpr
  canvas.height = rect.height * dpr
  ctx.scale(dpr, dpr)

  const W = rect.width
  const H = rect.height
  const VOLUME_H = Math.floor(H * 0.18)
  const CHART_H = H - VOLUME_H - 48 // 48 = x-axis label space + gap
  const PAD = { top: 12, right: 12, bottom: 28, left: 60 }
  const chartW = W - PAD.left - PAD.right
  const n = candles.c.length

  ctx.clearRect(0, 0, W, H)

  // ---- Price range ----
  const allHigh = Math.max(...candles.h)
  const allLow  = Math.min(...candles.l)
  const priceRange = allHigh - allLow || 1
  const padPct = 0.06
  const pMin = allLow  - priceRange * padPct
  const pMax = allHigh + priceRange * padPct
  const pRange = pMax - pMin

  const toX = (i: number) => PAD.left + (i / Math.max(n - 1, 1)) * chartW
  const toY = (p: number) => PAD.top + CHART_H - ((p - pMin) / pRange) * CHART_H

  const candleW = Math.max(2, Math.min(12, chartW / n * 0.7))

  // ---- Y grid ----
  const gridCount = 5
  ctx.font = `10px 'DM Mono', monospace`
  ctx.textAlign = 'right'
  for (let i = 0; i <= gridCount; i++) {
    const p = pMin + (pRange / gridCount) * i
    const y = toY(p)
    ctx.strokeStyle = 'rgba(255,255,255,0.04)'
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(PAD.left, y)
    ctx.lineTo(W - PAD.right, y)
    ctx.stroke()
    ctx.fillStyle = 'rgba(255,255,255,0.28)'
    ctx.fillText(`$${p.toFixed(0)}`, PAD.left - 6, y + 3.5)
  }

  // ---- X labels (every ~8 candles) ----
  ctx.textAlign = 'center'
  ctx.fillStyle = 'rgba(255,255,255,0.28)'
  const labelStep = Math.max(1, Math.floor(n / 8))
  for (let i = 0; i < n; i += labelStep) {
    const label = candles.t[i]?.slice(0, 10) ?? ''
    ctx.fillText(label, toX(i), PAD.top + CHART_H + 16)
  }

  // ---- Volume bars ----
  const maxVol = Math.max(...candles.v) || 1
  for (let i = 0; i < n; i++) {
    const x = toX(i)
    const up = candles.c[i] >= candles.o[i]
    const vh = (candles.v[i] / maxVol) * VOLUME_H
    const vy = H - VOLUME_H - PAD.bottom + (VOLUME_H - vh)
    ctx.fillStyle = up
      ? 'rgba(99,214,173,0.35)'
      : 'rgba(231,118,118,0.35)'
    ctx.fillRect(x - candleW / 2, vy, candleW, vh)
  }

  // ---- Candlesticks ----
  for (let i = 0; i < n; i++) {
    const x    = toX(i)
    const open  = toY(candles.o[i])
    const close = toY(candles.c[i])
    const high  = toY(candles.h[i])
    const low   = toY(candles.l[i])
    const up    = candles.c[i] >= candles.o[i]

    const bodyTop    = Math.min(open, close)
    const bodyBottom = Math.max(open, close)
    const bodyH      = Math.max(1, bodyBottom - bodyTop)

    const fillColor   = up ? '#63d6ad' : '#e77676'
    const strokeColor = up ? '#4abf94' : '#cc5f5f'

    // Wick
    ctx.strokeStyle = strokeColor
    ctx.lineWidth = 1.2
    ctx.beginPath()
    ctx.moveTo(x, high)
    ctx.lineTo(x, low)
    ctx.stroke()

    // Body
    ctx.fillStyle = fillColor
    ctx.fillRect(x - candleW / 2, bodyTop, candleW, bodyH)
  }

  // ---- Accent line (last close trajectory) ----
  if (n > 1) {
    const grad = ctx.createLinearGradient(PAD.left, 0, W - PAD.right, 0)
    grad.addColorStop(0, `${accentColor}00`)
    grad.addColorStop(1, `${accentColor}66`)
    ctx.strokeStyle = grad
    ctx.lineWidth = 1.5
    ctx.setLineDash([4, 4])
    ctx.beginPath()
    for (let i = 0; i < n; i++) {
      const x = toX(i)
      const y = toY(candles.c[i])
      if (i === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    }
    ctx.stroke()
    ctx.setLineDash([])
  }
}

/* Fallback: draw plain line chart from legacy priceHistory */
function drawLineChart(
  canvas: HTMLCanvasElement,
  dates: string[],
  prices: number[],
  accentColor: string
) {
  const ctx = canvas.getContext('2d')
  if (!ctx || !prices.length) return
  const dpr = window.devicePixelRatio || 1
  const rect = canvas.getBoundingClientRect()
  canvas.width = rect.width * dpr
  canvas.height = rect.height * dpr
  ctx.scale(dpr, dpr)
  const W = rect.width; const H = rect.height
  const PAD = { top: 8, right: 8, bottom: 28, left: 56 }
  const cW = W - PAD.left - PAD.right; const cH = H - PAD.top - PAD.bottom
  ctx.clearRect(0, 0, W, H)
  const minP = Math.min(...prices); const maxP = Math.max(...prices)
  const range = maxP - minP || 1
  const pMin = minP - range * 0.05; const pMax = maxP + range * 0.05; const pRange = pMax - pMin
  const toX = (i: number) => PAD.left + (i / (prices.length - 1 || 1)) * cW
  const toY = (p: number) => PAD.top + cH - ((p - pMin) / pRange) * cH
  ctx.font = '10px DM Mono, monospace'; ctx.textAlign = 'right'; ctx.fillStyle = 'rgba(255,255,255,0.28)'
  for (let i = 0; i <= 4; i++) {
    const p = pMin + (pRange / 4) * i; const y = toY(p)
    ctx.strokeStyle = 'rgba(255,255,255,0.04)'; ctx.lineWidth = 1
    ctx.beginPath(); ctx.moveTo(PAD.left, y); ctx.lineTo(W - PAD.right, y); ctx.stroke()
    ctx.fillText(`$${p.toFixed(0)}`, PAD.left - 4, y + 3)
  }
  ctx.textAlign = 'center'; ctx.fillStyle = 'rgba(255,255,255,0.28)'
  const step = Math.max(1, Math.floor(prices.length / 8))
  for (let i = 0; i < prices.length; i += step) ctx.fillText(dates[i] ?? '', toX(i), H - 6)
  ctx.strokeStyle = accentColor; ctx.lineWidth = 2; ctx.lineJoin = 'round'
  ctx.beginPath()
  prices.forEach((p, i) => { if (i === 0) ctx.moveTo(toX(i), toY(p)); else ctx.lineTo(toX(i), toY(p)) })
  ctx.stroke()
}

/* ===========================
   INFERENCE HELPERS
   =========================== */

function deriveInference(candles: CandleData | null) {
  if (!candles || candles.c.length < 5) {
    return { trend: 'Insufficient data', volatility: '—', note: '—' }
  }
  const prices = candles.c
  const n = prices.length
  const first = prices[0]; const last = prices[n - 1]
  const pctChange = ((last - first) / first) * 100

  // Trend
  const trend =
    pctChange > 10  ? `▲ Strong uptrend (+${pctChange.toFixed(1)}%)` :
    pctChange > 2   ? `▲ Mild uptrend (+${pctChange.toFixed(1)}%)` :
    pctChange < -10 ? `▼ Strong downtrend (${pctChange.toFixed(1)}%)` :
    pctChange < -2  ? `▼ Mild downtrend (${pctChange.toFixed(1)}%)` :
                      `→ Sideways / ranging (${pctChange.toFixed(1)}%)`

  // Volatility (average daily range / price)
  const avgRange = candles.h.reduce((s, h, i) => s + (h - candles.l[i]), 0) / n
  const avgRangePct = (avgRange / last) * 100
  const volatility =
    avgRangePct > 4 ? `High (avg daily range ${avgRangePct.toFixed(1)}%)` :
    avgRangePct > 1.5 ? `Moderate (avg daily range ${avgRangePct.toFixed(1)}%)` :
                        `Low (avg daily range ${avgRangePct.toFixed(1)}%)`

  const note =
    pctChange > 0 && avgRangePct < 2
      ? 'Steady, low-volatility uptrend — typically a sign of institutional accumulation.'
      : pctChange > 0 && avgRangePct >= 4
      ? 'Strong gains accompanied by high volatility — momentum driven; watch for reversal signals.'
      : pctChange < 0
      ? 'Downward pressure present. Monitor support levels and earnings catalysts.'
      : 'Price is consolidating. Breakout direction may depend on upcoming macro or earnings news.'

  return { trend, volatility, note }
}

/* ===========================
   COMPONENT
   =========================== */

const TIMEFRAMES: Timeframe[] = ['1M', '6M', '1Y', '5Y', 'MAX']

function GraphView({ symbol, priceHistoryFallback }: GraphViewProps) {
  const [tf, setTf] = useState<Timeframe>('1Y')
  const [candles, setCandles] = useState<CandleData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  const canvasRef    = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  /* ---- Fetch candles on symbol/tf change ---- */
  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(false)
    fetchCandles(symbol, tf)
      .then((data) => {
        if (!cancelled) { setCandles(data); setLoading(false) }
      })
      .catch(() => {
        if (!cancelled) { setCandles(null); setLoading(false); setError(true) }
      })
    return () => { cancelled = true }
  }, [symbol, tf])

  /* ---- Draw chart ---- */
  const redraw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    if (candles && candles.c.length > 0) {
      drawCandleChart(canvas, candles, PrimaryColor)
    } else if (error && priceHistoryFallback) {
      drawLineChart(canvas, priceHistoryFallback.date, priceHistoryFallback.price, PrimaryColor)
    }
  }, [candles, error, priceHistoryFallback])

  useEffect(() => { if (!loading) redraw() }, [loading, redraw])

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const ro = new ResizeObserver(() => { if (!loading) redraw() })
    ro.observe(el)
    return () => ro.disconnect()
  }, [loading, redraw])

  /* ---- Stats ---- */
  const latestOpen  = candles?.o?.at(-1)
  const latestHigh  = candles?.h?.at(-1)
  const latestLow   = candles?.l?.at(-1)
  const latestClose = candles?.c?.at(-1)

  const stats = [
    { label: 'Open',  value: latestOpen  != null ? `$${latestOpen.toFixed(2)}`  : '—' },
    { label: 'High',  value: latestHigh  != null ? `$${latestHigh.toFixed(2)}`  : '—' },
    { label: 'Low',   value: latestLow   != null ? `$${latestLow.toFixed(2)}`   : '—' },
    { label: 'Close', value: latestClose != null ? `$${latestClose.toFixed(2)}` : '—' },
  ]

  const inference = deriveInference(candles)

  return (
    <div className="graph-view">
      {/* Timeframe selector */}
      <div className="timeframe-bar">
        {TIMEFRAMES.map((t) => (
          <button
            key={t}
            id={`tf-btn-${t}`}
            className={`timeframe-btn${tf === t ? ' active' : ''}`}
            onClick={() => setTf(t)}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Chart area */}
      <div className="stock-chart-container graph-chart-container" ref={containerRef}>
        {loading && (
          <div className="chart-loading-overlay">
            <div className="stock-spinner" />
          </div>
        )}
        <canvas
          ref={canvasRef}
          style={{ width: '100%', height: '100%', display: 'block', opacity: loading ? 0 : 1, transition: 'opacity 0.3s' }}
        />
        {!loading && !candles?.c.length && !priceHistoryFallback && (
          <div style={{ color: 'var(--text-muted)', padding: '20px', position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            No price data available for this timeframe
          </div>
        )}
      </div>

      {/* OHLC stat strip */}
      <div className="graph-stats-row">
        {stats.map((s) => (
          <div key={s.label} className="graph-stat">
            <span className="graph-stat-label">{s.label}</span>
            <span className="graph-stat-value">{s.value}</span>
          </div>
        ))}
      </div>

      {/* Inference */}
      <div className="inference-block">
        <h4 className="inference-title">Price Analysis</h4>
        <div className="inference-row">
          <span className="inference-key">Trend</span>
          <span className="inference-val">{inference.trend}</span>
        </div>
        <div className="inference-row">
          <span className="inference-key">Volatility</span>
          <span className="inference-val">{inference.volatility}</span>
        </div>
        <p className="inference-note">{inference.note}</p>
      </div>
    </div>
  )
}

export default GraphView
