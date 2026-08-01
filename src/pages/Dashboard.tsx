import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import Watchlist, { WatchlistItem } from '../components/Watchlist'
import StockChart from '../components/StockChart'

const API = import.meta.env.VITE_API_BASE_URL

interface QuoteResponse {
  symbol: string
  current_price: number
  percent_change?: number
  change?: number
  previous_close?: number
  high?: number
  low?: number
  open?: number
}

interface ProfileResponse {
  name?: string
  industry?: string
  country?: string
  market_cap?: number
  logo?: string
}

interface NewsItem {
  headline: string
  summary?: string
  published?: string
  source?: string
  url?: string
}

interface CandlePoint {
  label: string
  value: number
}

const watchlist: WatchlistItem[] = [
  { symbol: 'AAPL', name: 'Apple Inc.', price: '---', change: '---', positive: true },
  { symbol: 'MSFT', name: 'Microsoft Corp.', price: '---', change: '---', positive: true },
  { symbol: 'NVDA', name: 'NVIDIA Corp.', price: '---', change: '---', positive: true },
  { symbol: 'TSLA', name: 'Tesla Inc.', price: '---', change: '---', positive: false },
  { symbol: 'AMZN', name: 'Amazon.com', price: '---', change: '---', positive: true },
]

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 2,
})

const compactFormatter = new Intl.NumberFormat('en-US', {
  maximumFractionDigits: 2,
})

function normalizeCandles(payload: unknown): CandlePoint[] {
  if (Array.isArray(payload)) {
    return payload
      .map((entry, index) => {
        const item = entry as Record<string, unknown>
        const value = typeof item.close === 'number'
          ? item.close
          : typeof item.value === 'number'
            ? item.value
            : typeof item.c === 'number'
              ? item.c
              : Number(item.price)
        if (typeof value !== 'number' || Number.isNaN(value)) {
          return null
        }
        return {
          label: typeof item.label === 'string' ? item.label : `D${index + 1}`,
          value,
        }
      })
      .filter((item): item is CandlePoint => item !== null)
  }

  if (payload && typeof payload === 'object') {
    const record = payload as Record<string, unknown>
    const closes = Array.isArray(record.c)
      ? record.c.filter((item): item is number => typeof item === 'number')
      : Array.isArray(record.close)
        ? record.close.filter((item): item is number => typeof item === 'number')
        : []
    const timestamps = Array.isArray(record.t) ? record.t.filter((item): item is number => typeof item === 'number') : []

    return closes.map((value, index) => ({
      label: timestamps[index] ? new Date(timestamps[index] * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : `D${index + 1}`,
      value,
    }))
  }

  return []
}

function Dashboard() {
  const [symbol, setSymbol] = useState('AAPL')
  const [quote, setQuote] = useState<QuoteResponse | null>(null)
  const [profile, setProfile] = useState<ProfileResponse | null>(null)
  const [candles, setCandles] = useState<CandlePoint[]>([])
  const [news, setNews] = useState<NewsItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const quoteChange = quote ? (quote.percent_change ?? quote.change ?? 0) : 0
  const isPositive = quoteChange >= 0
  const topBarColor = isPositive ? '#22c55e' : '#ef4444'

  const fetchJson = async <T,>(path: string): Promise<T> => {
    const response = await fetch(`${API}${path}`)
    if (!response.ok) {
      throw new Error(`Request failed: ${response.status}`)
    }
    return response.json() as Promise<T>
  }

  useEffect(() => {
    let active = true

    const loadData = async () => {
      setLoading(true)
      setError(null)

      try {
        const [quoteData, profileData, candlesData, newsData] = await Promise.all([
          fetchJson<QuoteResponse>(`/api/quote/${symbol}`),
          fetchJson<ProfileResponse>(`/api/profile/${symbol}`),
          fetchJson<unknown>(`/api/candles/${symbol}?resolution=D&days=30`),
          fetchJson<NewsItem[]>(`/api/news/${symbol}`),
        ])

        if (!active) {
          return
        }

        setQuote(quoteData)
        setProfile(profileData)
        setCandles(normalizeCandles(candlesData))
        setNews(Array.isArray(newsData) ? newsData.slice(0, 5) : [])
      } catch {
        if (active) {
          setQuote(null)
          setProfile(null)
          setCandles([])
          setNews([])
          setError('Live market data is temporarily unavailable.')
        }
      } finally {
        if (active) {
          setLoading(false)
        }
      }
    }

    void loadData()

    return () => {
      active = false
    }
  }, [symbol])

  useEffect(() => {
    const id = window.setInterval(() => {
      const refreshQuote = async () => {
        try {
          const updatedQuote = await fetchJson<QuoteResponse>(`/api/quote/${symbol}`)
          setQuote(updatedQuote)
          setError(null)
        } catch {
          setError('Quote refresh failed. Showing last known data.')
        }
      }

      void refreshQuote()
    }, 10000)

    return () => window.clearInterval(id)
  }, [symbol])

  const watchlistItems = useMemo(() => watchlist.map((item) => {
    if (item.symbol !== symbol || !quote) {
      return item
    }

    const changeValue = quote.percent_change ?? quote.change ?? 0
    const changeText = `${changeValue >= 0 ? '+' : ''}${compactFormatter.format(changeValue)}%`

    return {
      ...item,
      price: currencyFormatter.format(quote.current_price),
      change: changeText,
      positive: changeValue >= 0,
    }
  }), [quote, symbol])

  const chartValues = candles.length > 0 ? candles.map((entry) => entry.value) : [quote?.current_price ?? 0]
  const chartLabels = candles.length > 0 ? candles.map((entry) => entry.label) : ['Live']

  return (
    <main className="dashboard-page">
      <div className="dashboard-container">
        <div className="dashboard-overlay">
          <header className="product-nav">
            <Link to="/" className="brand">PERSONAL SYSTEMS</Link>
            <nav>
              <Link to="/craps">Craps</Link>
              <Link className="current" to="/dashboard">Dashboard</Link>
            </nav>
            <span className="status-badge"><i /> Market open</span>
          </header>

          <div className="dashboard-shell">
            <section className="dashboard-topbar">
              <div>
                <p className="eyebrow">MARKET OVERVIEW</p>
                <div className="topbar-symbol-row">
                  <h1>{symbol}</h1>
                  <span>{profile?.name ?? 'Live equity quote'}</span>
                </div>
              </div>
              <div className="topbar-price">
                <span className="topbar-label">LAST PRICE</span>
                <strong>{quote ? currencyFormatter.format(quote.current_price) : '—'}</strong>
                <span className="change-pill" style={{ color: topBarColor }}>
                  {quote ? `${isPositive ? '+' : ''}${compactFormatter.format(quoteChange)}%` : '—'}
                </span>
              </div>
            </section>

            <section className="dashboard-grid">
              <Watchlist items={watchlistItems} selected={symbol} onSelect={setSymbol} />

              <article className="dashboard-main-card">
                <div className="panel-heading">
                  <div>
                    <p className="eyebrow">PRICE ACTION</p>
                    <h2>{symbol} intraday</h2>
                  </div>
                  <span className="muted-text">USD • NASDAQ</span>
                </div>

                {loading && !quote ? (
                  <div className="panel-state">Loading latest market data…</div>
                ) : error && !quote ? (
                  <div className="panel-state">{error}</div>
                ) : (
                  <>
                    <div className="chart-card">
                      <StockChart values={chartValues} labels={chartLabels} positive={isPositive} />
                    </div>
                    <div className="stats-strip">
                      <div>
                        <span className="muted-text">Open</span>
                        <strong>{quote?.open ? currencyFormatter.format(quote.open) : '—'}</strong>
                      </div>
                      <div>
                        <span className="muted-text">High</span>
                        <strong>{quote?.high ? currencyFormatter.format(quote.high) : '—'}</strong>
                      </div>
                      <div>
                        <span className="muted-text">Low</span>
                        <strong>{quote?.low ? currencyFormatter.format(quote.low) : '—'}</strong>
                      </div>
                      <div>
                        <span className="muted-text">Prev Close</span>
                        <strong>{quote?.previous_close ? currencyFormatter.format(quote.previous_close) : '—'}</strong>
                      </div>
                    </div>
                  </>
                )}
              </article>

              <aside className="dashboard-news-card">
                <div className="panel-heading">
                  <div>
                    <p className="eyebrow">NEWS</p>
                    <h2>Latest headlines</h2>
                  </div>
                </div>
                <div className="news-list">
                  {news.length > 0 ? news.map((article, index) => (
                    <a href={article.url} target="_blank" rel="noreferrer" className="news-item" key={`${article.headline}-${index}`}>
                      <span className="news-meta">{article.source ?? 'Market'}</span>
                      <strong>{article.headline}</strong>
                      <span className="news-time">{article.published ?? 'Now'}</span>
                    </a>
                  )) : (
                    <div className="panel-state secondary">No news available for {symbol} right now.</div>
                  )}
                </div>
              </aside>
            </section>

            <section className="dashboard-bottom-grid">
              <article className="dashboard-panel">
                <div className="panel-heading compact">
                  <div>
                    <p className="eyebrow">METRICS</p>
                    <h2>Key metrics</h2>
                  </div>
                </div>
                <div className="detail-grid">
                  <div>
                    <span className="muted-text">Market cap</span>
                    <strong>{profile?.market_cap ? currencyFormatter.format(profile.market_cap) : '—'}</strong>
                  </div>
                  <div>
                    <span className="muted-text">Volume</span>
                    <strong>—</strong>
                  </div>
                  <div>
                    <span className="muted-text">Day range</span>
                    <strong>{quote?.high && quote?.low ? `${currencyFormatter.format(quote.low)} – ${currencyFormatter.format(quote.high)}` : '—'}</strong>
                  </div>
                </div>
              </article>

              <article className="dashboard-panel">
                <div className="panel-heading compact">
                  <div>
                    <p className="eyebrow">RANGE 52W</p>
                    <h2>Price range</h2>
                  </div>
                </div>
                <div className="detail-grid range-card">
                  <div>
                    <span className="muted-text">High</span>
                    <strong>{quote?.high ? currencyFormatter.format(quote.high) : '—'}</strong>
                  </div>
                  <div>
                    <span className="muted-text">Low</span>
                    <strong>{quote?.low ? currencyFormatter.format(quote.low) : '—'}</strong>
                  </div>
                </div>
              </article>

              <article className="dashboard-panel">
                <div className="panel-heading compact">
                  <div>
                    <p className="eyebrow">COMPANY</p>
                    <h2>Profile</h2>
                  </div>
                </div>
                <div className="detail-grid">
                  <div>
                    <span className="muted-text">Name</span>
                    <strong>{profile?.name ?? symbol}</strong>
                  </div>
                  <div>
                    <span className="muted-text">Industry</span>
                    <strong>{profile?.industry ?? '—'}</strong>
                  </div>
                  <div>
                    <span className="muted-text">Country</span>
                    <strong>{profile?.country ?? '—'}</strong>
                  </div>
                </div>
              </article>
            </section>
          </div>
        </div>
      </div>
    </main>
  )
}

export default Dashboard
