import { useEffect, useRef } from 'react'
import { PrimaryColor } from './StockAnalysisDashboard'

interface StockChartProps {
  priceHistory: {
    date: string[]
    price: number[]
  }
}

function drawLineChart(canvas: HTMLCanvasElement, dates: string[], prices: number[], lineColor: string) {
  const ctx = canvas.getContext('2d')
  if (!ctx || !prices.length) return

  const dpr = window.devicePixelRatio || 1
  const rect = canvas.getBoundingClientRect()
  canvas.width = rect.width * dpr
  canvas.height = rect.height * dpr
  ctx.scale(dpr, dpr)

  const W = rect.width
  const H = rect.height
  const PAD = { top: 8, right: 8, bottom: 28, left: 52 }
  const chartW = W - PAD.left - PAD.right
  const chartH = H - PAD.top - PAD.bottom

  ctx.clearRect(0, 0, W, H)

  const minP = Math.min(...prices)
  const maxP = Math.max(...prices)
  const range = maxP - minP || 1
  const paddedMin = minP - range * 0.05
  const paddedMax = maxP + range * 0.05
  const paddedRange = paddedMax - paddedMin

  const toX = (i: number) => PAD.left + (i / (prices.length - 1 || 1)) * chartW
  const toY = (p: number) => PAD.top + chartH - ((p - paddedMin) / paddedRange) * chartH

  // Y grid + labels
  const gridLines = 4
  ctx.font = '10px Inter, sans-serif'
  ctx.textAlign = 'right'
  for (let i = 0; i <= gridLines; i++) {
    const price = paddedMin + (paddedRange / gridLines) * i
    const y = toY(price)
    ctx.strokeStyle = '#222222'
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(PAD.left, y)
    ctx.lineTo(W - PAD.right, y)
    ctx.stroke()
    ctx.fillStyle = '#555555'
    ctx.fillText(price.toFixed(2), PAD.left - 4, y + 3)
  }

  // X labels
  ctx.textAlign = 'center'
  ctx.fillStyle = '#555555'
  const labelStep = Math.max(1, Math.floor(prices.length / 8))
  for (let i = 0; i < prices.length; i += labelStep) {
    ctx.fillText(dates[i] ?? '', toX(i), H - PAD.bottom + 14)
  }

  // Line
  ctx.strokeStyle = lineColor
  ctx.lineWidth = 2
  ctx.lineJoin = 'round'
  ctx.beginPath()
  prices.forEach((p, i) => {
    const x = toX(i)
    const y = toY(p)
    if (i === 0) ctx.moveTo(x, y)
    else ctx.lineTo(x, y)
  })
  ctx.stroke()
}

function StockChart({ priceHistory }: StockChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  if (!priceHistory || !priceHistory.date || !priceHistory.price || priceHistory.date.length === 0) {
    return (
      <div style={{ color: 'var(--text-muted)', padding: '20px' }}>
        No price data available
      </div>
    )
  }

  const { date, price } = priceHistory

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    drawLineChart(canvas, date, price, PrimaryColor)
  }, [date, price])

  useEffect(() => {
    const container = containerRef.current
    const canvas = canvasRef.current
    if (!container || !canvas) return
    const ro = new ResizeObserver(() => drawLineChart(canvas, date, price, PrimaryColor))
    ro.observe(container)
    return () => ro.disconnect()
  }, [date, price])

  return (
    <div ref={containerRef} style={{ width: '100%', height: '100%' }}>
      <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block' }} />
    </div>
  )
}

export default StockChart
