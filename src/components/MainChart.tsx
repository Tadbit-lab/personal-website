import { useEffect, useMemo, useState } from 'react'
import { Chart } from 'react-chartjs-2'
import {
  BarController,
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  ChartData,
  ChartOptions,
  FinancialDataPoint,
  Legend,
  LinearScale,
  Tooltip,
} from 'chart.js'
import { CandlestickController, CandlestickElement } from 'chartjs-chart-financial'

ChartJS.register(BarController, BarElement, CategoryScale, CandlestickController, CandlestickElement, Legend, LinearScale, Tooltip)

export type Timeframe = '1D' | '1W' | '1M' | '6M' | '1Y' | '5Y' | 'MAX'

interface MainChartProps {
  symbol: string
  timeframe: Timeframe
  onTrendCalculated?: (isPositive: boolean, pctChange: number) => void
}
interface Candle { x: number; o: number; h: number; l: number; c: number; v: number; label: string }
type MainChartType = 'bar' | 'candlestick'
type MainChartDatum = FinancialDataPoint | { x: number; y: number }

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

  const data = useMemo<ChartData<MainChartType, MainChartDatum[], string>>(() => ({
    labels: candles.map(({ label }) => label),
    datasets: [
      {
        type: 'candlestick' as const,
        label: 'Price',
        data: candles.map(({ x, o, h, l, c }) => ({ x, o, h, l, c })),
        yAxisID: 'price',
        color: {
          up: '#22c55e',
          down: '#ef4444',
          unchanged: '#8b9296'
        }
      },
      {
        type: 'bar' as const,
        label: 'Volume',
        data: candles.map(({ x, v }) => ({ x, y: v })),
        yAxisID: 'volume',
        backgroundColor: 'rgba(203, 213, 225, .16)',
        borderWidth: 0,
        barPercentage: .9,
        categoryPercentage: 1
      },
    ],
  }), [candles])

  const options: ChartOptions<MainChartType> = {
    responsive: true,
    maintainAspectRatio: false,
    animation: false,
    parsing: false,
    plugins: { legend: { display: false }, tooltip: { mode: 'index', intersect: false } },
    scales: {
      x: { type: 'category', grid: { color: 'rgba(255,255,255,.045)' }, ticks: { color: '#cbd5e1', maxTicksLimit: 6, maxRotation: 0 } },
      price: { type: 'linear', position: 'right', grid: { color: 'rgba(255,255,255,.07)' }, ticks: { color: '#cbd5e1', maxTicksLimit: 5 } },
      volume: { type: 'linear', position: 'left', display: false, grid: { display: false }, beginAtZero: true },
    },
  }

  if (loading) return <div className="chart-wrap chart-message">Loading historical data…</div>
  if (error || !candles.length) return <div className="chart-wrap chart-message">{error ?? 'No chart data available.'}</div>

  return <div className="chart-wrap main-chart"><Chart<MainChartType, MainChartDatum[], string> type="bar" data={data} options={options} /></div>
}

export default MainChart
