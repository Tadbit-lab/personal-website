import React, { useCallback, useEffect, useMemo, useState } from 'react'
import MainChart, { Timeframe } from './MainChart'

interface TechnicalsData {
  symbol: string
  current_price: number
  change?: number
  percent_change?: number
  fifty_two_week?: {
    low: number
    high: number
    range: string
  }
  volume?: number
  average_volume?: number
  volume_ratio?: number
  rsi_14?: number | null
  rsi_status?: string
  macd?: {
    value: number | null
    signal: number | null
    histogram: number | null
    status: string
  }
  moving_averages?: {
    sma_20: number | null
    sma_50: number | null
    sma_200: number | null
    price_vs_sma20: number | null
    price_vs_sma50: number | null
    price_vs_sma200: number | null
  }
  bollinger_bands?: {
    upper: number | null
    middle: number | null
    lower: number | null
  }
  returns?: {
    return_1m: number | null
    return_3m: number | null
    return_6m: number | null
    return_1y: number | null
  }
  signals?: {
    trend: string
    rsi: string
    macd: string
    golden_cross: boolean
  }
  timestamp?: number
}

interface GraphViewProps {
  symbol: string
  timeframe: Timeframe
  onTimeframeChange: (tf: Timeframe) => void
  currentQuote: {
    open?: number
    high?: number
    low?: number
    previous_close?: number
    current_price?: number
    percent_change?: number
    change?: number
    volume?: number
    average_volume?: number
    fifty_two_week?: {
      low: number
      high: number
      range: string
    }
  } | null
}

const API = import.meta.env.VITE_API_BASE_URL

const GraphView: React.FC<GraphViewProps> = ({
  symbol,
  timeframe,
  onTimeframeChange,
  currentQuote,
}) => {
  const allowedTimeframes: Timeframe[] = ['1M', '6M', '1Y', '5Y', 'MAX']
  const [historicalTrend, setHistoricalTrend] = useState<{ isPositive: boolean; pctChange: number } | null>(null)
  const [technicals, setTechnicals] = useState<TechnicalsData | null>(null)
  const [techLoading, setTechLoading] = useState(false)

  const currencyFormatter = useMemo(() => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }), [])
  const compactFormatter = useMemo(() => new Intl.NumberFormat('en-US', { notation: 'compact', compactDisplay: 'short' }), [])
  const signFormatter = useMemo(() => new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 }), [])

  const handleTrendCalculated = useCallback((isPositive: boolean, pctChange: number) => {
    setHistoricalTrend({ isPositive, pctChange })
  }, [])

  // Fetch Twelve Data technical indicators
  useEffect(() => {
    let active = true
    setTechLoading(true)
    fetch(`${API}/api/technicals/${symbol}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (active && data && !data.error) {
          setTechnicals(data)
        }
      })
      .catch(() => {
        // Fallback gracefully without breaking UI
      })
      .finally(() => {
        if (active) setTechLoading(false)
      })
    return () => {
      active = false
    }
  }, [symbol])

  // Inference derived from HISTORICAL chart trend and Twelve Data technicals
  const inference = useMemo(() => {
    const isUp = historicalTrend?.isPositive ?? (currentQuote?.percent_change ?? 0) >= 0
    const absChange = Math.abs(historicalTrend?.pctChange ?? currentQuote?.percent_change ?? 0)

    let trend = technicals?.signals?.trend || 'Neutral / Consolidation'
    let volatility = 'Moderate Volatility'
    let interpretation = 'Price is consolidating around moving average support. Key volume patterns suggest institutional accumulation.'

    if (absChange > 30) {
      trend = isUp ? 'Strong Bullish Expansion' : 'Strong Bearish Selloff'
      volatility = 'High Volatility'
      interpretation = isUp
        ? 'Substantial cumulative buying pressure over the selected period. Multi-year trajectory points to robust upward momentum driven by strong institutional accumulation.'
        : 'Severe cumulative downward pressure over the selected period. The stock has faced persistent selling. Immediate support levels should be closely monitored.'
    } else if (absChange > 10) {
      trend = isUp ? 'Moderate Bullish Trend' : 'Moderate Bearish Trend'
      volatility = 'Moderate Volatility'
      interpretation = isUp
        ? 'Steady upward progression over the selected period. Consistent buying interest signals positive investor sentiment and healthy market reception.'
        : 'Consistent distribution over the selected period. The stock is facing headwinds and mild profit-taking, indicating a sustained consolidation phase.'
    } else if (absChange > 3) {
      trend = isUp ? 'Mild Bullish Bias' : 'Mild Bearish Bias'
      volatility = 'Low-to-Moderate Volatility'
      interpretation = isUp
        ? 'Gradual upward drift with controlled momentum. Buyers are absorbing supply at a measured pace.'
        : 'Gradual downward drift with muted momentum. Mild selling pressure without significant capitulation.'
    }

    return { trend, volatility, interpretation }
  }, [historicalTrend, currentQuote, technicals])

  // 52-Week Range calculation
  const fiftyTwoWeek = technicals?.fifty_two_week || currentQuote?.fifty_two_week
  const price = currentQuote?.current_price || technicals?.current_price || 0
  const rangePct = useMemo(() => {
    if (!fiftyTwoWeek || !fiftyTwoWeek.high || !fiftyTwoWeek.low || fiftyTwoWeek.high <= fiftyTwoWeek.low) return 50
    const pct = ((price - fiftyTwoWeek.low) / (fiftyTwoWeek.high - fiftyTwoWeek.low)) * 100
    return Math.max(0, Math.min(100, Math.round(pct)))
  }, [fiftyTwoWeek, price])

  return (
    <div className="graph-view-panel">
      <article className="dashboard-main-card">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">PRICE ACTION</p>
            <h2 style={{ display: 'flex', alignItems: 'baseline', gap: '10px' }}>
              {symbol} Historical Chart
              {historicalTrend && (
                <span
                  className={historicalTrend.isPositive ? 'text-green' : 'text-red'}
                  style={{ fontSize: '14px', fontWeight: 700, letterSpacing: '0.02em' }}
                >
                  {historicalTrend.isPositive ? '+' : ''}{signFormatter.format(historicalTrend.pctChange)}%
                  <span style={{ fontWeight: 400, opacity: 0.65, fontSize: '12px', marginLeft: '4px' }}>({timeframe})</span>
                </span>
              )}
            </h2>
          </div>
          <span className="muted-text">USD • TWELVE DATA LAYER</span>
        </div>

        <div className="chart-card">
          <MainChart symbol={symbol} timeframe={timeframe} onTrendCalculated={handleTrendCalculated} />
        </div>

        <div className="timeframe-selector" role="group" aria-label="Chart timeframe">
          {allowedTimeframes.map((tf) => (
            <button
              key={tf}
              type="button"
              className={timeframe === tf ? 'active' : ''}
              onClick={() => onTimeframeChange(tf)}
            >
              {tf}
            </button>
          ))}
        </div>

        <div className="stats-strip">
          <div>
            <span className="muted-text">Open</span>
            <strong>{currentQuote?.open ? currencyFormatter.format(currentQuote.open) : '—'}</strong>
          </div>
          <div>
            <span className="muted-text">High</span>
            <strong>{currentQuote?.high ? currencyFormatter.format(currentQuote.high) : '—'}</strong>
          </div>
          <div>
            <span className="muted-text">Low</span>
            <strong>{currentQuote?.low ? currencyFormatter.format(currentQuote.low) : '—'}</strong>
          </div>
          <div>
            <span className="muted-text">Prev Close</span>
            <strong>{currentQuote?.previous_close ? currencyFormatter.format(currentQuote.previous_close) : '—'}</strong>
          </div>
        </div>
      </article>

      {/* Twelve Data Technical Indicators Report */}
      <article className="dashboard-panel technicals-panel">
        <div className="panel-heading compact">
          <div>
            <p className="eyebrow">TWELVE DATA METRICS</p>
            <h2>Technical Indicators & Multi-Timeframe Signals</h2>
          </div>
          <span className="muted-text">{techLoading ? 'Syncing indicators…' : 'LIVE COMPUTED'}</span>
        </div>

        <div className="technicals-grid">
          {/* RSI (14) */}
          <div className="technical-card">
            <span className="card-label">RSI (14)</span>
            <div className="card-value">
              {technicals?.rsi_14 != null ? technicals.rsi_14.toFixed(1) : '—'}
            </div>
            <div className="card-subtext">
              <span
                className={`badge-pill ${
                  technicals?.rsi_status === 'Overbought'
                    ? 'badge-bearish'
                    : technicals?.rsi_status === 'Oversold'
                    ? 'badge-bullish'
                    : 'badge-neutral'
                }`}
              >
                {technicals?.rsi_status || 'Neutral'}
              </span>
            </div>
          </div>

          {/* MACD */}
          <div className="technical-card">
            <span className="card-label">MACD (12, 26, 9)</span>
            <div className="card-value">
              {technicals?.macd?.histogram != null ? (
                <span className={technicals.macd.histogram >= 0 ? 'text-green' : 'text-red'}>
                  {technicals.macd.histogram >= 0 ? '+' : ''}{technicals.macd.histogram.toFixed(2)}
                </span>
              ) : (
                '—'
              )}
            </div>
            <div className="card-subtext">
              <span className={`badge-pill ${technicals?.macd?.status?.includes('Bullish') ? 'badge-bullish' : 'badge-neutral'}`}>
                {technicals?.macd?.status || 'Neutral'}
              </span>
            </div>
          </div>

          {/* SMA 50 / 200 */}
          <div className="technical-card">
            <span className="card-label">Moving Averages</span>
            <div className="card-value" style={{ fontSize: '15px' }}>
              SMA50: {technicals?.moving_averages?.sma_50 ? currencyFormatter.format(technicals.moving_averages.sma_50) : '—'}
            </div>
            <div className="card-subtext">
              SMA200: {technicals?.moving_averages?.sma_200 ? currencyFormatter.format(technicals.moving_averages.sma_200) : '—'}
            </div>
          </div>

          {/* 52-Week Range */}
          <div className="technical-card">
            <span className="card-label">52-Week Range</span>
            <div className="range-meter-track">
              <div className="range-meter-fill" style={{ width: `${rangePct}%` }} />
            </div>
            <div className="card-subtext" style={{ justifyContent: 'space-between' }}>
              <span>{fiftyTwoWeek?.low ? currencyFormatter.format(fiftyTwoWeek.low) : '—'}</span>
              <strong style={{ color: '#e2e8f0' }}>{rangePct}%</strong>
              <span>{fiftyTwoWeek?.high ? currencyFormatter.format(fiftyTwoWeek.high) : '—'}</span>
            </div>
          </div>

          {/* Volume Analysis */}
          <div className="technical-card">
            <span className="card-label">Volume Analysis</span>
            <div className="card-value" style={{ fontSize: '15px' }}>
              {technicals?.volume ? compactFormatter.format(technicals.volume) : '—'}
            </div>
            <div className="card-subtext">
              Avg: {technicals?.average_volume ? compactFormatter.format(technicals.average_volume) : '—'}
              {technicals?.volume_ratio != null && (
                <span className="badge-pill badge-neutral" style={{ marginLeft: 'auto' }}>
                  {technicals.volume_ratio}x avg
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Multi-Period Historical Performance Table */}
        <div style={{ marginTop: '4px' }}>
          <span className="card-label" style={{ display: 'block', marginBottom: '4px' }}>
            Historical Performance
          </span>
          <table className="returns-table">
            <thead>
              <tr>
                <th>1 Month</th>
                <th>3 Months</th>
                <th>6 Months</th>
                <th>1 Year</th>
                <th>Golden Cross</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className={(technicals?.returns?.return_1m ?? 0) >= 0 ? 'text-green' : 'text-red'}>
                  {technicals?.returns?.return_1m != null
                    ? `${technicals.returns.return_1m >= 0 ? '+' : ''}${technicals.returns.return_1m}%`
                    : '—'}
                </td>
                <td className={(technicals?.returns?.return_3m ?? 0) >= 0 ? 'text-green' : 'text-red'}>
                  {technicals?.returns?.return_3m != null
                    ? `${technicals.returns.return_3m >= 0 ? '+' : ''}${technicals.returns.return_3m}%`
                    : '—'}
                </td>
                <td className={(technicals?.returns?.return_6m ?? 0) >= 0 ? 'text-green' : 'text-red'}>
                  {technicals?.returns?.return_6m != null
                    ? `${technicals.returns.return_6m >= 0 ? '+' : ''}${technicals.returns.return_6m}%`
                    : '—'}
                </td>
                <td className={(technicals?.returns?.return_1y ?? 0) >= 0 ? 'text-green' : 'text-red'}>
                  {technicals?.returns?.return_1y != null
                    ? `${technicals.returns.return_1y >= 0 ? '+' : ''}${technicals.returns.return_1y}%`
                    : '—'}
                </td>
                <td>
                  <span className={`badge-pill ${technicals?.signals?.golden_cross ? 'badge-bullish' : 'badge-neutral'}`}>
                    {technicals?.signals?.golden_cross ? 'Active (Bullish)' : 'None'}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </article>

      <article className="dashboard-panel inference-panel">
        <div className="panel-heading compact">
          <div>
            <p className="eyebrow">ANALYTICS</p>
            <h2>Inference Engine</h2>
          </div>
        </div>
        <div className="inference-content">
          <div className="inference-grid">
            <div className="inference-item">
              <span className="muted-text">Historical Trend</span>
              <strong
                className={
                  inference.trend.includes('Bullish') || inference.trend.includes('Mild Bullish')
                    ? 'text-green'
                    : inference.trend.includes('Bearish') || inference.trend.includes('Mild Bearish')
                    ? 'text-red'
                    : ''
                }
              >
                {historicalTrend ? inference.trend : 'Loading chart…'}
              </strong>
            </div>
            <div className="inference-item">
              <span className="muted-text">Period Return</span>
              <strong className={historicalTrend?.isPositive ? 'text-green' : historicalTrend ? 'text-red' : ''}>
                {historicalTrend
                  ? `${historicalTrend.isPositive ? '+' : ''}${signFormatter.format(historicalTrend.pctChange)}%`
                  : '—'}
              </strong>
            </div>
            <div className="inference-item">
              <span className="muted-text">Volatility Note</span>
              <strong>{inference.volatility}</strong>
            </div>
            <div className="inference-item">
              <span className="muted-text">Daily Change</span>
              <strong className={(currentQuote?.percent_change ?? 0) >= 0 ? 'text-green' : 'text-red'}>
                {currentQuote?.percent_change != null
                  ? `${currentQuote.percent_change >= 0 ? '+' : ''}${signFormatter.format(currentQuote.percent_change)}%`
                  : '—'}
              </strong>
            </div>
          </div>
          <div className="inference-description">
            <span className="muted-text">Multi-Period Interpretation</span>
            <p>{historicalTrend ? inference.interpretation : 'Waiting for historical data to compute trend analysis.'}</p>
          </div>
        </div>
      </article>
    </div>
  )
}

export default GraphView
