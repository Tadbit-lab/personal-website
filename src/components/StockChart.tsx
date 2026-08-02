import { useEffect, useRef, useState, useMemo } from 'react'

interface StockChartProps {
  values: number[]
  labels: string[]
  positive: boolean
  symbol?: string
  timeframe?: string
  loading?: boolean
  error?: string | null
}

interface CandlestickPoint {
  x: number
  o: number
  h: number
  l: number
  c: number
}

interface CandleApiResponse {
  timestamps?: number[]
  open?: number[]
  high?: number[]
  low?: number[]
  close?: number[]
  volume?: number[]
}

const API = import.meta.env.VITE_API_BASE_URL

function normalizeCandles(payload: CandleApiResponse | null | undefined): CandlestickPoint[] {
  if (!payload) return []
  const timestamps = Array.isArray(payload.timestamps) ? payload.timestamps : []
  const opens = Array.isArray(payload.open) ? payload.open : []
  const highs = Array.isArray(payload.high) ? payload.high : []
  const lows = Array.isArray(payload.low) ? payload.low : []
  const closes = Array.isArray(payload.close) ? payload.close : []
  if (!timestamps.length || !opens.length || !highs.length || !lows.length || !closes.length) return []
  return timestamps.map((timestamp, index) => {
    const rawTime = typeof timestamp === 'number' ? timestamp : Number(timestamp)
    const x = Number.isFinite(rawTime) ? rawTime * (rawTime > 1_000_000_000_000 ? 1 : 1000) : Date.now()
    return {
      x,
      o: typeof opens[index] === 'number' ? opens[index] : 0,
      h: typeof highs[index] === 'number' ? highs[index] : 0,
      l: typeof lows[index] === 'number' ? lows[index] : 0,
      c: typeof closes[index] === 'number' ? closes[index] : 0,
    }
  })
}

function drawCandlesticks(canvas: HTMLCanvasElement, candles: CandlestickPoint[]) {
  const ctx = canvas.getContext('2d')
  if (!ctx || !candles.length) return

  const dpr = window.devicePixelRatio || 1
  const rect = canvas.getBoundingClientRect()
  canvas.width = rect.width * dpr
  canvas.height = rect.height * dpr
  ctx.scale(dpr, dpr)

  const W = rect.width
  const H = rect.height
  const PAD = { top: 16, right: 12, bottom: 32, left: 56 }
  const chartW = W - PAD.left - PAD.right
  const chartH = H - PAD.top - PAD.bottom

  ctx.clearRect(0, 0, W, H)

  const allPrices = candles.flatMap(c => [c.h, c.l])
  const minP = Math.min(...allPrices)
  const maxP = Math.max(...allPrices)
  const range = maxP - minP || 1
  const paddedMin = minP - range * 0.05
  const paddedMax = maxP + range * 0.05
  const paddedRange = paddedMax - paddedMin

  const toY = (price: number) => PAD.top + chartH - ((price - paddedMin) / paddedRange) * chartH
  const toX = (i: number) => PAD.left + (i / (candles.length - 1 || 1)) * chartW

  // Grid lines
  const gridLines = 5
  ctx.strokeStyle = 'rgba(255,255,255,0.06)'
  ctx.lineWidth = 1
  ctx.font = '10px Inter, sans-serif'
  ctx.fillStyle = '#6b7280'
  ctx.textAlign = 'right'
  for (let i = 0; i <= gridLines; i++) {
    const price = paddedMin + (paddedRange / gridLines) * i
    const y = toY(price)
    ctx.beginPath()
    ctx.moveTo(PAD.left, y)
    ctx.lineTo(W - PAD.right, y)
    ctx.stroke()
    ctx.fillText(price.toFixed(2), PAD.left - 4, y + 3)
  }

  // X axis labels
  ctx.textAlign = 'center'
  const labelStep = Math.max(1, Math.floor(candles.length / 6))
  for (let i = 0; i < candles.length; i += labelStep) {
    const x = toX(i)
    const date = new Date(candles[i].x)
    const label = `${date.getMonth() + 1}/${date.getDate()}`
    ctx.fillText(label, x, H - PAD.bottom + 14)
  }

  // Candles
  const candleW = Math.max(2, Math.min(12, chartW / candles.length * 0.6))
  candles.forEach((c, i) => {
    const x = toX(i)
    const bullish = c.c >= c.o
    const color = bullish ? '#22c55e' : '#ef4444'

    ctx.strokeStyle = color
    ctx.lineWidth = 1

    // Wick
    ctx.beginPath()
    ctx.moveTo(x, toY(c.h))
    ctx.lineTo(x, toY(c.l))
    ctx.stroke()

    // Body
    const bodyTop = toY(Math.max(c.o, c.c))
    const bodyBot = toY(Math.min(c.o, c.c))
    const bodyH = Math.max(1, bodyBot - bodyTop)
    ctx.fillStyle = color
    ctx.fillRect(x - candleW / 2, bodyTop, candleW, bodyH)
  })
}

function StockChart({ values, labels, symbol, timeframe, loading: propLoading = false, error: propError = null }: StockChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [candles, setCandles] = useState<CandlestickPoint[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const transformedFallbackData = useMemo<CandlestickPoint[]>(() => {
    if (!values.length) return []
    return values.map((value, index) => {
      const previous = values[index - 1] ?? value
      const open = previous
      const close = value
      const spread = Math.max(Math.abs(close - open), 1)
      const high = Math.max(open, close) + spread * 0.12
      const low = Math.min(open, close) - spread * 0.12
      const parsedLabel = labels[index]
      const parsedTime = parsedLabel ? Date.parse(parsedLabel) : Number.NaN
      const x = Number.isFinite(parsedTime) ? parsedTime : Date.now() - (values.length - index - 1) * 24 * 60 * 60 * 1000
      return { x, o: open, h: high, l: low, c: close }
    })
  }, [labels, values])

  useEffect(() => {
    let active = true
    const loadCandles = async () => {
      if (!symbol) { setCandles([]); setError(null); setIsLoading(false); return }
      setIsLoading(true); setError(null)
      try {
        const resolution = 'D'
        const response = await fetch(`${API}/api/candles/${symbol}?resolution=${resolution}&days=30`)
        if (!response.ok) throw new Error('Unable to load candles')
        const payload = (await response.json()) as CandleApiResponse
        if (!active) return
        setCandles(normalizeCandles(payload))
      } catch {
        if (active) { setCandles([]); setError('Unable to load candles') }
      } finally {
        if (active) setIsLoading(false)
      }
    }
    void loadCandles()
    return () => { active = false }
  }, [symbol, timeframe])

  const resolvedCandles = candles.length > 0 ? candles : transformedFallbackData

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !resolvedCandles.length) return
    drawCandlesticks(canvas, resolvedCandles)
  }, [resolvedCandles])

  useEffect(() => {
    const container = containerRef.current
    const canvas = canvasRef.current
    if (!container || !canvas) return
    const ro = new ResizeObserver(() => {
      if (resolvedCandles.length) drawCandlesticks(canvas, resolvedCandles)
    })
    ro.observe(container)
    return () => ro.disconnect()
  }, [resolvedCandles])

  if (propLoading || isLoading) {
    return (
      <div className="chart-wrap" style={{ height: '100%', display: 'grid', placeItems: 'center', color: '#9ca3af' }}>
        Loading chart…
      </div>
    )
  }

  if (propError || error) {
    return (
      <div className="chart-wrap" style={{ height: '100%', display: 'grid', placeItems: 'center', color: '#ef4444' }}>
        {propError ?? error}
      </div>
    )
  }

  if (!resolvedCandles.length) {
    return (
      <div className="chart-wrap" style={{ height: '100%', display: 'grid', placeItems: 'center', color: '#9ca3af' }}>
        No data available
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      className="chart-wrap"
      style={{ height: '100%', background: '#0b1220', padding: '12px', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px' }}
    >
      <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block' }} />
    </div>
  )
}

export default StockChart
