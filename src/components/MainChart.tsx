// @ts-nocheck
import { useEffect, useMemo, useState } from 'react'
import { Chart } from 'react-chartjs-2'
import {
  BarController,
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Filler,
  Legend,
  LinearScale,
  LineController,
  LineElement,
  PointElement,
  Tooltip,
} from 'chart.js'

ChartJS.register(
  LineController,
  LineElement,
  PointElement,
  BarController,
  BarElement,
  CategoryScale,
  LinearScale,
  Legend,
  Tooltip,
  Filler
)

export type Timeframe = '1D' | '1W' | '1M' | '6M' | '1Y' | '5Y' | 'MAX'

interface MainChartProps {
  symbol: string
  timeframe: Timeframe
  onTrendCalculated?: (isPositive: boolean, pctChange: number) => void
}

interface Candle {
  x: number
  o: number
  h: number
  l: number
  c: number
  v: number
  label: string
}

const API = import.meta.env.VITE_API_BASE_URL
const ranges: Record<Timeframe, { resolution: 'D' | 'W' | 'M'; days: number }> = {
  '1D': { resolution: 'D', days: 5 },
  '1W': { resolution: 'D', days: 7 },
  '1M': { resolution: 'D', days: 30 },
  '6M': { resolution: 'D', days: 180 },
  '1Y': { resolution: 'D', days: 365 },
  '5Y': { resolution: 'W', days: 260 },
  MAX: { resolution: 'M', days: 300 },
}

function numberAt(source: unknown, index: number) {
  return Array.isArray(source) && typeof source[index] === 'number' ? source[index] : 0
}

function normalize(payload: unknown): Candle[] {
  const record = payload as Record<string, unknown>
  const timestamps = Array.isArray(record?.t) ? record.t : Array.isArray(record?.timestamps) ? record.timestamps : []
  const open = Array.isArray(record?.o) ? record.o : Array.isArray(record?.open) ? record.open : []
  const high = Array.isArray(record?.h) ? record.h : Array.isArray(record?.high) ? record.high : []
  const low = Array.isArray(record?.l) ? record.l : Array.isArray(record?.low) ? record.low : []
  const close = Array.isArray(record?.c) ? record.c : Array.isArray(record?.close) ? record.close : []
  const volume = Array.isArray(record?.v) ? record.v : Array.isArray(record?.volume) ? record.volume : []

  return timestamps
    .map((raw, index) => {
      const seconds = Number(raw)
      const ms = seconds > 1e12 ? seconds : seconds * 1000
      const date = new Date(ms)
      return {
        x: index,
        o: numberAt(open, index),
        h: numberAt(high, index),
        l: numberAt(low, index),
        c: numberAt(close, index),
        v: numberAt(volume, index),
        label: Number.isNaN(date.valueOf())
          ? `${index + 1}`
          : date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' }),
      }
    })
    .filter(({ h, l, c }) => h || l || c)
}

// Crosshair Plugin
const crosshairPlugin = {
  id: 'customCrosshair',
  afterDraw: (chart: any) => {
    if (chart.tooltip?._active && chart.tooltip._active.length) {
      const ctx = chart.ctx
      const activePoint = chart.tooltip._active[0]
      const x = activePoint.element.x
      const y = activePoint.element.y
      const topY = chart.scales.price.top
      const bottomY = chart.scales.price.bottom
      const leftX = chart.scales.x.left
      const rightX = chart.scales.price.left

      ctx.save()
      ctx.beginPath()
      ctx.setLineDash([3, 3])
      ctx.lineWidth = 1
      ctx.strokeStyle = '#475569'

      // Vertical crosshair
      ctx.moveTo(x, topY)
      ctx.lineTo(x, bottomY)

      // Horizontal crosshair
      ctx.moveTo(leftX, y)
      ctx.lineTo(rightX, y)

      ctx.stroke()
      ctx.restore()
    }
  },
}

function MainChart({ symbol, timeframe, onTrendCalculated }: MainChartProps) {
  const [candles, setCandles] = useState<Candle[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let current = true
    const range = ranges[timeframe] || { resolution: 'D', days: 30 }
    setLoading(true)
    setError(null)
    fetch(`${API}/api/candles/${symbol}?resolution=${range.resolution}&days=${range.days}&forceRefresh=true`)
      .then((response) => {
        if (!response.ok) throw new Error('Candle fetch failed')
        return response.json()
      })
      .then((payload) => {
        if (current) {
          const list = normalize(payload)
          if (list.length > 0) {
            setCandles(list)
          } else {
            setError('No historical data available for this timeframe.')
          }
        }
      })
      .catch(() => {
        if (current) {
          setCandles([])
          setError('Historical data is temporarily unavailable.')
        }
      })
      .finally(() => {
        if (current) setLoading(false)
      })
    return () => {
      current = false
    }
  }, [symbol, timeframe])

  // Fire trend callback whenever candles change
  useEffect(() => {
    if (!onTrendCalculated || candles.length < 2) return
    const firstClose = candles[0].c
    const lastClose = candles[candles.length - 1].c
    const pctChange = ((lastClose - firstClose) / firstClose) * 100
    onTrendCalculated(lastClose >= firstClose, pctChange)
  }, [candles, onTrendCalculated])

  // Calculate SMA50 and SMA200 lines
  const { sma50Data, sma200Data } = useMemo(() => {
    const closes = candles.map((c) => c.c)
    const sma50: (number | null)[] = []
    const sma200: (number | null)[] = []

    for (let i = 0; i < closes.length; i++) {
      if (i >= 49) {
        const slice = closes.slice(i - 49, i + 1)
        sma50.push(Number((slice.reduce((a, b) => a + b, 0) / 50).toFixed(2)))
      } else {
        // Linear approximation / partial average for visibility
        const slice = closes.slice(0, i + 1)
        sma50.push(Number((slice.reduce((a, b) => a + b, 0) / slice.length).toFixed(2)))
      }

      if (i >= 199) {
        const slice = closes.slice(i - 199, i + 1)
        sma200.push(Number((slice.reduce((a, b) => a + b, 0) / 200).toFixed(2)))
      } else {
        const slice = closes.slice(0, i + 1)
        sma200.push(Number((slice.reduce((a, b) => a + b, 0) / slice.length).toFixed(2)))
      }
    }
    return { sma50Data: sma50, sma200Data: sma200 }
  }, [candles])

  const data = useMemo<any>(() => {
    return {
      labels: candles.map(({ label }) => label),
      datasets: [
        {
          type: 'line',
          label: 'Price',
          data: candles.map(({ c }) => c),
          yAxisID: 'price',
          borderColor: '#60a5fa',
          borderWidth: 2,
          pointRadius: 0,
          pointHoverRadius: 4,
          pointHoverBackgroundColor: '#60a5fa',
          pointHoverBorderColor: '#ffffff',
          pointHoverBorderWidth: 2,
          fill: true,
          backgroundColor: (context: any) => {
            const ctx = context.chart.ctx
            const gradient = ctx.createLinearGradient(0, 0, 0, 320)
            gradient.addColorStop(0, 'rgba(96, 165, 250, 0.10)')
            gradient.addColorStop(1, 'rgba(96, 165, 250, 0.00)')
            return gradient
          },
          tension: 0.15,
        },
        {
          type: 'line',
          label: 'SMA 50',
          data: sma50Data,
          yAxisID: 'price',
          borderColor: '#f59e0b',
          borderWidth: 1,
          borderDash: [4, 4],
          pointRadius: 0,
          fill: false,
          tension: 0.1,
        },
        {
          type: 'line',
          label: 'SMA 200',
          data: sma200Data,
          yAxisID: 'price',
          borderColor: '#8b5cf6',
          borderWidth: 1,
          borderDash: [4, 4],
          pointRadius: 0,
          fill: false,
          tension: 0.1,
        },
        {
          type: 'bar',
          label: 'Volume',
          data: candles.map(({ v }) => v),
          yAxisID: 'volume',
          backgroundColor: 'rgba(148, 163, 184, 0.30)',
          borderWidth: 0,
          barPercentage: 0.85,
          categoryPercentage: 1,
        },
      ],
    }
  }, [candles, sma50Data, sma200Data])

  const options = useMemo<any>(() => {
    return {
      responsive: true,
      maintainAspectRatio: false,
      animation: false,
      interaction: {
        mode: 'index',
        intersect: false,
      },
      plugins: {
        legend: {
          display: true,
          position: 'top',
          align: 'end',
          labels: {
            boxWidth: 12,
            boxHeight: 2,
            color: '#9ca3af',
            font: { size: 10, family: 'Inter, sans-serif' },
            filter: (legendItem: any) => legendItem.text !== 'Volume',
          },
        },
        tooltip: {
          enabled: true,
          backgroundColor: 'rgba(15, 23, 42, 0.95)',
          titleColor: '#f9fafb',
          bodyColor: '#cbd5e1',
          borderColor: '#334155',
          borderWidth: 1,
          padding: 10,
          displayColors: false,
          titleFont: { size: 12, weight: 600, family: 'Inter, sans-serif' },
          bodyFont: { size: 11, family: 'DM Mono, monospace' },
          callbacks: {
            label: (context: any) => {
              const index = context.dataIndex
              const candle = candles[index]
              if (!candle || context.dataset.label !== 'Price') return ''
              return [
                `Open:   $${candle.o.toFixed(2)}`,
                `High:   $${candle.h.toFixed(2)}`,
                `Low:    $${candle.l.toFixed(2)}`,
                `Close:  $${candle.c.toFixed(2)}`,
                `Volume: ${new Intl.NumberFormat('en-US', { notation: 'compact' }).format(candle.v)}`,
              ]
            },
          },
        },
      },
      scales: {
        x: {
          type: 'category',
          grid: {
            color: '#1e293b',
            lineWidth: 1,
          },
          border: {
            dash: [4, 4],
            color: '#1e293b',
          },
          ticks: {
            color: '#9ca3af',
            font: { size: 11, family: 'Inter, sans-serif' },
            maxTicksLimit: 6,
            maxRotation: 0,
          },
        },
        price: {
          type: 'linear',
          position: 'right',
          grid: {
            color: '#1e293b',
            lineWidth: 1,
          },
          border: {
            dash: [4, 4],
            color: '#1e293b',
          },
          ticks: {
            color: '#9ca3af',
            font: { size: 11, family: 'DM Mono, monospace' },
            maxTicksLimit: 6,
            callback: (value: any) => `$${Number(value).toFixed(2)}`,
          },
        },
        volume: {
          type: 'linear',
          position: 'left',
          display: false,
          grid: { display: false },
          beginAtZero: true,
          // Push volume bars to bottom 25% of chart
          max: Math.max(...candles.map((c) => c.v), 1) * 4,
        },
      },
    }
  }, [candles])

  if (loading) return <div className="chart-wrap chart-message">Loading historical data…</div>
  if (error || !candles.length) return <div className="chart-wrap chart-message"><span style={{ color: '#6b7280' }}>n/a</span></div>

  return (
    <div className="chart-wrap main-chart">
      <Chart
        type="line"
        data={data}
        options={options}
        plugins={[crosshairPlugin]}
      />
    </div>
  )
}

export default MainChart
