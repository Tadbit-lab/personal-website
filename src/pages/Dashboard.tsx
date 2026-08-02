import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import Watchlist, { WatchlistItem } from '../components/Watchlist'
import StockChart from '../components/StockChart'

const API = import.meta.env.VITE_API_BASE_URL
const QUOTE_REFRESH_MS = 10_000
const FUNDAMENTAL_CACHE_MS = 60 * 60 * 1_000
const INITIAL_WATCHLIST = ['AAPL', 'MSFT', 'TSLA', 'NVDA', 'GOOGL'] as const

interface QuoteData {
  symbol: string
  current_price: number
  percent_change?: number
  change?: number
  previous_close?: number
  high?: number
  low?: number
  open?: number
  volume?: number
  market_cap?: number
  pe_ratio?: number
}

interface ProfileData {
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

interface CacheEntry<T> {
  data: T
  lastUpdated: number
}

const watchlistNames: Record<string, string> = {
  AAPL: 'Apple Inc.',
  MSFT: 'Microsoft Corp.',
  TSLA: 'Tesla Inc.',
  NVDA: 'NVIDIA Corp.',
  GOOGL: 'Alphabet Inc.',
}

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
  const [activeSymbol, setActiveSymbol] = useState('AAPL')
  const [watchlistSymbols, setWatchlistSymbols] = useState<string[]>([...INITIAL_WATCHLIST])
  const [quoteCache, setQuoteCache] = useState<Record<string, CacheEntry<QuoteData>>>({})
  const [fundamentalCache, setFundamentalCache] = useState<Record<string, CacheEntry<ProfileData>>>({})
  const [watchlistQuotes, setWatchlistQuotes] = useState<Record<string, QuoteData>>({})
  const [candles, setCandles] = useState<CandlePoint[]>([])
  const [news, setNews] = useState<NewsItem[]>([])
  const [loading, setLoading] = useState(true)
  const [watchlistLoading, setWatchlistLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchInput, setSearchInput] = useState('')

  const quoteCacheRef = useRef<Record<string, CacheEntry<QuoteData>>>({})
  const fundamentalCacheRef = useRef<Record<string, CacheEntry<ProfileData>>>({})

  useEffect(() => {
    quoteCacheRef.current = quoteCache
  }, [quoteCache])

  useEffect(() => {
    fundamentalCacheRef.current = fundamentalCache
  }, [fundamentalCache])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const normalized = searchInput.trim().toUpperCase()
      if (normalized.length <= 5) {
        setSearchInput(normalized)
      }
    }, 500)

    return () => window.clearTimeout(timer)
  }, [searchInput])

  const currentQuote = quoteCache[activeSymbol]?.data ?? watchlistQuotes[activeSymbol] ?? null
  const currentProfile = fundamentalCache[activeSymbol]?.data ?? null

  const quoteChange = currentQuote ? (currentQuote.percent_change ?? currentQuote.change ?? 0) : 0
  const isPositive = quoteChange >= 0
  const topBarColor = isPositive ? '#22c55e' : '#ef4444'

  const fetchJson = async <T,>(path: string): Promise<T> => {
    const response = await fetch(`${API}${path}`)
    if (!response.ok) {
      throw new Error(`Request failed: ${response.status}`)
    }
    return response.json() as Promise<T>
  }

  const setQuoteEntry = (symbol: string, data: QuoteData) => {
    const entry: CacheEntry<QuoteData> = { data, lastUpdated: Date.now() }
    quoteCacheRef.current = { ...quoteCacheRef.current, [symbol]: entry }
    setQuoteCache(quoteCacheRef.current)
    setWatchlistQuotes((previous) => ({ ...previous, [symbol]: data }))
    return entry
  }

  const setFundamentalEntry = (symbol: string, data: ProfileData) => {
    const entry: CacheEntry<ProfileData> = { data, lastUpdated: Date.now() }
    fundamentalCacheRef.current = { ...fundamentalCacheRef.current, [symbol]: entry }
    setFundamentalCache(fundamentalCacheRef.current)
    return entry
  }

  const loadQuote = async (symbolToLoad: string): Promise<QuoteData | null> => {
    const cached = quoteCacheRef.current[symbolToLoad]
    if (cached && Date.now() - cached.lastUpdated < QUOTE_REFRESH_MS) {
      return cached.data
    }

    try {
      const data = await fetchJson<QuoteData>(`/api/quote/${symbolToLoad}`)
      setQuoteEntry(symbolToLoad, data)
      return data
    } catch {
      return null
    }
  }

  const loadFundamental = async (symbolToLoad: string): Promise<ProfileData | null> => {
    const cached = fundamentalCacheRef.current[symbolToLoad]
    if (cached && Date.now() - cached.lastUpdated < FUNDAMENTAL_CACHE_MS) {
      return cached.data
    }

    try {
      const data = await fetchJson<ProfileData>(`/api/profile/${symbolToLoad}`)
      setFundamentalEntry(symbolToLoad, data)
      return data
    } catch {
      return null
    }
  }

  useEffect(() => {
    let active = true

    const preloadWatchlist = async () => {
      setWatchlistLoading(true)
      setError(null)

      const results = await Promise.allSettled(INITIAL_WATCHLIST.map((symbol) => loadQuote(symbol)))
      if (!active) {
        return
      }

      const failed = results.filter((result) => result.status === 'rejected' || result.value === null).length
      if (failed > 0 && !error) {
        setError('Some watchlist quotes are still syncing.')
      }
      setWatchlistLoading(false)
    }

    void preloadWatchlist()

    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    let active = true

    const loadActiveSymbolData = async () => {
      setLoading(true)
      setError(null)

      try {
        const [quoteData, profileData, candlesData, newsData] = await Promise.all([
          loadQuote(activeSymbol),
          loadFundamental(activeSymbol),
          fetchJson<unknown>(`/api/candles/${activeSymbol}?resolution=D&days=30`),
          fetchJson<NewsItem[]>(`/api/news/${activeSymbol}`),
        ])

        if (!active) {
          return
        }

        if (!quoteData) {
          throw new Error('quote failed')
        }

        if (profileData) {
          setFundamentalEntry(activeSymbol, profileData)
        }

        setCandles(normalizeCandles(candlesData))
        setNews(Array.isArray(newsData) ? newsData.slice(0, 5) : [])
      } catch {
        if (active) {
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

    void loadActiveSymbolData()

    return () => {
      active = false
    }
  }, [activeSymbol])

  useEffect(() => {
    const id = window.setInterval(() => {
      void Promise.allSettled(watchlistSymbols.map((symbol) => loadQuote(symbol)))
    }, QUOTE_REFRESH_MS)

    return () => window.clearInterval(id)
  }, [watchlistSymbols])

  const handleSearchSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const normalized = searchInput.trim().toUpperCase()

    if (!normalized || normalized.length > 5) {
      setError('Please enter a valid ticker symbol between 1 and 5 characters.')
      return
    }

    const quoteData = await loadQuote(normalized)
    if (!quoteData) {
      setError('Unable to load that ticker right now.')
      return
    }

    setActiveSymbol(normalized)
    setSearchInput('')
    setWatchlistSymbols((previous) => (previous.includes(normalized) ? previous : [...previous, normalized]))
    setError(null)
  }

  const watchlistItems = useMemo<WatchlistItem[]>(() => {
    return watchlistSymbols.map((symbol) => {
      const quote = watchlistQuotes[symbol] ?? quoteCache[symbol]?.data ?? null
      const changeValue = quote?.percent_change ?? quote?.change ?? 0
      const changeText = quote
        ? `${changeValue >= 0 ? '+' : ''}${compactFormatter.format(changeValue)}%`
        : '---'
      const priceText = quote ? currencyFormatter.format(quote.current_price) : '---'

      return {
        symbol,
        name: watchlistNames[symbol] ?? symbol,
        price: watchlistLoading ? '...' : priceText,
        change: watchlistLoading ? 'syncing' : changeText,
        positive: quote ? changeValue >= 0 : true,
      }
    })
  }, [quoteCache, watchlistLoading, watchlistQuotes, watchlistSymbols])

  const chartValues = candles.length > 0 ? candles.map((entry) => entry.value) : [currentQuote?.current_price ?? 0]
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
                  <h1>{activeSymbol}</h1>
                  <span>{currentProfile?.name ?? 'Live equity quote'}</span>
                </div>
              </div>
              <div className="topbar-actions">
                <form className="dashboard-search" onSubmit={handleSearchSubmit}>
                  <input
                    type="text"
                    value={searchInput}
                    onChange={(event) => setSearchInput(event.target.value)}
                    placeholder="Ticker"
                    maxLength={5}
                  />
                  <button type="submit">Search</button>
                </form>
                <div className="topbar-price">
                  <span className="topbar-label">LAST PRICE</span>
                  <strong>{currentQuote ? currencyFormatter.format(currentQuote.current_price) : '—'}</strong>
                  <span className="change-pill" style={{ color: topBarColor }}>
                    {currentQuote ? `${isPositive ? '+' : ''}${compactFormatter.format(quoteChange)}%` : '—'}
                  </span>
                </div>
              </div>
            </section>

            <section className="dashboard-grid">
              <div className="watchlist-column">
                <div className="watchlist-loading">
                  {watchlistLoading ? 'Loading watchlist…' : `Streaming ${watchlistSymbols.length} symbols`}
                </div>
                <Watchlist items={watchlistItems} selected={activeSymbol} onSelect={setActiveSymbol} />
              </div>

              <article className="dashboard-main-card">
                <div className="panel-heading">
                  <div>
                    <p className="eyebrow">PRICE ACTION</p>
                    <h2>{activeSymbol} intraday</h2>
                  </div>
                  <span className="muted-text">USD • NASDAQ</span>
                </div>

                {loading && !currentQuote ? (
                  <div className="panel-state">Loading latest market data…</div>
                ) : error && !currentQuote ? (
                  <div className="panel-state">{error}</div>
                ) : (
                  <>
                    <div className="chart-card">
                      <StockChart values={chartValues} labels={chartLabels} positive={isPositive} />
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
                    <div className="panel-state secondary">No news available for {activeSymbol} right now.</div>
                  )}
                </div>
              </aside>
            </section>

            <section className="dashboard-bottom-grid">
              <article className="dashboard-panel metrics-panel">
                <div className="panel-heading compact">
                  <div>
                    <p className="eyebrow">METRICS</p>
                    <h2>Key metrics</h2>
                  </div>
                </div>
                <div className="detail-grid">
                  <div>
                    <span className="muted-text">Market cap</span>
                    <strong>{currentProfile?.market_cap ? currencyFormatter.format(currentProfile.market_cap) : '—'}</strong>
                  </div>
                  <div>
                    <span className="muted-text">Volume</span>
                    <strong>{currentQuote?.volume ? compactFormatter.format(currentQuote.volume) : '—'}</strong>
                  </div>
                  <div>
                    <span className="muted-text">P/E</span>
                    <strong>{currentQuote?.pe_ratio ? compactFormatter.format(currentQuote.pe_ratio) : '—'}</strong>
                  </div>
                </div>
              </article>

              <article className="dashboard-panel range-panel">
                <div className="panel-heading compact">
                  <div>
                    <p className="eyebrow">RANGE 52W</p>
                    <h2>Price range</h2>
                  </div>
                </div>
                <div className="detail-grid range-card">
                  <div>
                    <span className="muted-text">High</span>
                    <strong>{currentQuote?.high ? currencyFormatter.format(currentQuote.high) : '—'}</strong>
                  </div>
                  <div>
                    <span className="muted-text">Low</span>
                    <strong>{currentQuote?.low ? currencyFormatter.format(currentQuote.low) : '—'}</strong>
                  </div>
                </div>
              </article>

              <article className="dashboard-panel profile-panel">
                <div className="panel-heading compact">
                  <div>
                    <p className="eyebrow">COMPANY</p>
                    <h2>Profile</h2>
                  </div>
                </div>
                <div className="detail-grid">
                  <div>
                    <span className="muted-text">Name</span>
                    <strong>{currentProfile?.name ?? activeSymbol}</strong>
                  </div>
                  <div>
                    <span className="muted-text">Industry</span>
                    <strong>{currentProfile?.industry ?? '—'}</strong>
                  </div>
                  <div>
                    <span className="muted-text">Country</span>
                    <strong>{currentProfile?.country ?? '—'}</strong>
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
