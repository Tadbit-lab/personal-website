import { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import Watchlist, { WatchlistItem } from '../components/Watchlist'
import DashboardSidebar, { ActiveView } from '../components/DashboardSidebar'
import GraphView from '../components/GraphView'
import { Timeframe } from '../components/MainChart'

const WordCloud = lazy(() => import('../components/WordCloud'))
const CompanyInfoView = lazy(() => import('../components/CompanyInfoView'))

const API = import.meta.env.VITE_API_BASE_URL
const QUOTE_REFRESH_MS = 10_000
const FUNDAMENTAL_CACHE_MS = 60 * 60 * 1_000
const INITIAL_WATCHLIST = ['AAPL', 'MSFT', 'TSLA', 'NVDA', 'GOOGL'] as const
const employeeKeywords = [
  { word: 'Engineering', frequency: 92 }, { word: 'Innovation', frequency: 81 }, { word: 'Product', frequency: 75 },
  { word: 'Collaboration', frequency: 68 }, { word: 'Leadership', frequency: 59 }, { word: 'Research', frequency: 54 },
  { word: 'Culture', frequency: 47 }, { word: 'Operations', frequency: 42 }, { word: 'Benefits', frequency: 36 },
]

interface QuoteData { symbol: string; current_price: number; percent_change?: number; change?: number; previous_close?: number; high?: number; low?: number; open?: number; volume?: number; market_cap?: number; pe_ratio?: number }
interface ProfileData { name?: string; industry?: string; country?: string; market_cap?: number }
interface NewsItem { headline: string; published?: string; source?: string; url?: string }
interface CacheEntry<T> { data: T; lastUpdated: number }
type MobileTab = 'graph' | 'info' | 'watchlist' | 'news' | 'employees'

const watchlistNames: Record<string, string> = { AAPL: 'Apple Inc.', MSFT: 'Microsoft Corp.', TSLA: 'Tesla Inc.', NVDA: 'NVIDIA Corp.', GOOGL: 'Alphabet Inc.' }
const currencyFormatter = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 })
const compactFormatter = new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 })

function useMobileLayout() {
  const [mobile, setMobile] = useState(() => window.matchMedia('(max-width: 767.98px)').matches)
  useEffect(() => { const query = window.matchMedia('(max-width: 767.98px)'); const update = () => setMobile(query.matches); update(); query.addEventListener('change', update); return () => query.removeEventListener('change', update) }, [])
  return mobile
}

function Dashboard() {
  const [activeSymbol, setActiveSymbol] = useState('AAPL')
  const [timeframe, setTimeframe] = useState<Timeframe>('1Y')
  const [activeTab, setActiveTab] = useState<MobileTab>('graph')
  const [activeView, setActiveView] = useState<ActiveView>('graph')
  const [watchlistSymbols, setWatchlistSymbols] = useState<string[]>([...INITIAL_WATCHLIST])
  const [quoteCache, setQuoteCache] = useState<Record<string, CacheEntry<QuoteData>>>({})
  const [fundamentalCache, setFundamentalCache] = useState<Record<string, CacheEntry<ProfileData>>>({})
  const [watchlistQuotes, setWatchlistQuotes] = useState<Record<string, QuoteData>>({})
  const [news, setNews] = useState<NewsItem[]>([])
  const [loading, setLoading] = useState(true)
  const [watchlistLoading, setWatchlistLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchInput, setSearchInput] = useState('')
  const quoteCacheRef = useRef<Record<string, CacheEntry<QuoteData>>>({})
  const fundamentalCacheRef = useRef<Record<string, CacheEntry<ProfileData>>>({})
  const activeSymbolRef = useRef('AAPL')
  const isMobile = useMobileLayout()

  useEffect(() => { quoteCacheRef.current = quoteCache }, [quoteCache])
  useEffect(() => { fundamentalCacheRef.current = fundamentalCache }, [fundamentalCache])
  const fetchJson = async <T,>(path: string): Promise<T> => { const response = await fetch(`${API}${path}`); if (!response.ok) throw new Error(`Request failed: ${response.status}`); return response.json() as Promise<T> }
  const setQuoteEntry = (symbol: string, data: QuoteData) => { const entry = { data, lastUpdated: Date.now() }; quoteCacheRef.current = { ...quoteCacheRef.current, [symbol]: entry }; setQuoteCache(quoteCacheRef.current); setWatchlistQuotes((previous) => ({ ...previous, [symbol]: data })); return entry }
  const setFundamentalEntry = (symbol: string, data: ProfileData) => { const entry = { data, lastUpdated: Date.now() }; fundamentalCacheRef.current = { ...fundamentalCacheRef.current, [symbol]: entry }; setFundamentalCache(fundamentalCacheRef.current); return entry }
  const loadQuote = async (symbol: string, forceRefresh = false) => { const cached = quoteCacheRef.current[symbol]; if (!forceRefresh && cached && Date.now() - cached.lastUpdated < QUOTE_REFRESH_MS) return cached.data; try { return setQuoteEntry(symbol, await fetchJson<QuoteData>(`/api/quote/${symbol}`)).data } catch { return null } }
  const loadFundamental = async (symbol: string) => { const cached = fundamentalCacheRef.current[symbol]; if (cached && Date.now() - cached.lastUpdated < FUNDAMENTAL_CACHE_MS) return cached.data; try { return setFundamentalEntry(symbol, await fetchJson<ProfileData>(`/api/profile/${symbol}`)).data } catch { return null } }

  useEffect(() => { let current = true; void Promise.allSettled(INITIAL_WATCHLIST.map((s) => loadQuote(s))).then((results) => { if (!current) return; if (results.some((result) => result.status === 'rejected' || result.value === null)) setError('Some watchlist quotes are still syncing.'); setWatchlistLoading(false) }); return () => { current = false } }, [])
  useEffect(() => {
    let current = true
    activeSymbolRef.current = activeSymbol
    setLoading(true); setError(null)
    // Force-refresh quote for newly selected symbol so data is never stale
    void Promise.all([loadQuote(activeSymbol, true), loadFundamental(activeSymbol), fetchJson<NewsItem[]>(`/api/news/${activeSymbol}`)])
      .then(([quote, , articles]) => { if (!current) return; if (!quote) throw new Error(); setNews(Array.isArray(articles) ? articles.slice(0, 5) : []) })
      .catch(() => { if (current) { setNews([]); setError('Live market data is temporarily unavailable.') } })
      .finally(() => { if (current) setLoading(false) })
    return () => { current = false }
  }, [activeSymbol])
  // Poll ALL watchlist symbols + active symbol every 10s
  useEffect(() => {
    const id = window.setInterval(() => {
      const allSymbols = Array.from(new Set([activeSymbolRef.current, ...watchlistSymbols]))
      void Promise.allSettled(allSymbols.map((s) => loadQuote(s, true)))
    }, QUOTE_REFRESH_MS)
    return () => window.clearInterval(id)
  }, [watchlistSymbols])

  const currentQuote = quoteCache[activeSymbol]?.data ?? watchlistQuotes[activeSymbol] ?? null
  const currentProfile = fundamentalCache[activeSymbol]?.data ?? null
  const quoteChange = currentQuote?.percent_change ?? currentQuote?.change ?? 0
  const isPositive = quoteChange >= 0
  const watchlistItems = useMemo<WatchlistItem[]>(() => watchlistSymbols.map((symbol) => { const quote = watchlistQuotes[symbol] ?? quoteCache[symbol]?.data; const change = quote?.percent_change ?? quote?.change ?? 0; return { symbol, name: watchlistNames[symbol] ?? symbol, price: watchlistLoading ? '...' : quote ? currencyFormatter.format(quote.current_price) : '---', change: watchlistLoading ? 'syncing' : quote ? `${change >= 0 ? '+' : ''}${compactFormatter.format(change)}%` : '---', positive: change >= 0 } }), [quoteCache, watchlistLoading, watchlistQuotes, watchlistSymbols])
  const submitSearch = async (event: React.FormEvent<HTMLFormElement>) => { event.preventDefault(); const symbol = searchInput.trim().toUpperCase(); if (!symbol || symbol.length > 5) { setError('Please enter a valid ticker symbol between 1 and 5 characters.'); return } if (!await loadQuote(symbol)) { setError('Unable to load that ticker right now.'); return } setActiveSymbol(symbol); setSearchInput(''); setWatchlistSymbols((previous) => previous.includes(symbol) ? previous : [...previous, symbol]); setError(null) }
  const selectSymbol = (symbol: string) => { setActiveSymbol(symbol); setActiveTab('graph'); setActiveView('graph') }

  const newsPanel = <aside className="dashboard-news-card"><div className="panel-heading compact"><div><p className="eyebrow">NEWS</p><h2>Latest headlines</h2></div></div><div className="news-list">{news.length ? news.map((article, index) => <a href={article.url} target="_blank" rel="noreferrer" className="news-item" key={`${article.headline}-${index}`}><span className="news-meta">{article.source ?? 'Market'}</span><strong>{article.headline}</strong><span className="news-time">{article.published ?? 'Now'}</span></a>) : <div className="panel-state secondary">No news available for {activeSymbol} right now.</div>}</div></aside>
  const employees = <article className="dashboard-panel employees-panel"><div className="panel-heading compact"><div><p className="eyebrow">EMPLOYEES</p><h2>Workforce themes</h2></div></div><Suspense fallback={<div className="panel-state secondary">Loading employee themes…</div>}><WordCloud words={employeeKeywords} /></Suspense></article>

  const watchlistNode = (
    <Watchlist items={watchlistItems} selected={activeSymbol} onSelect={selectSymbol} />
  )

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
                <form className="dashboard-search" onSubmit={submitSearch}>
                  <input value={searchInput} onChange={(event) => setSearchInput(event.target.value)} placeholder="Ticker" maxLength={5} />
                  <button type="submit">Search</button>
                </form>
                <div className="topbar-price">
                  <span className="topbar-label">LAST PRICE</span>
                  <strong>{currentQuote ? currencyFormatter.format(currentQuote.current_price) : '—'}</strong>
                  <span className={`change-pill ${isPositive ? 'positive' : 'negative'}`}>{currentQuote ? `${isPositive ? '+' : ''}${compactFormatter.format(quoteChange)}%` : '—'}</span>
                </div>
              </div>
            </section>

            {error && !loading && <div className="dashboard-inline-error">{error}</div>}

            {isMobile ? (
              <section className="mobile-dashboard">
                <div className="mobile-tab-strip" role="tablist">
                  {(['graph', 'info', 'watchlist', 'news', 'employees'] as MobileTab[]).map((tab) => (
                    <button
                      key={tab}
                      type="button"
                      role="tab"
                      aria-selected={activeTab === tab}
                      className={activeTab === tab ? 'active' : ''}
                      onClick={() => setActiveTab(tab)}
                    >
                      {tab === 'info' ? 'Company Info' : tab.toUpperCase()}
                    </button>
                  ))}
                </div>
                <div className="mobile-tab-panel animate-fade-in">
                  {activeTab === 'graph' && (
                    <GraphView
                      symbol={activeSymbol}
                      timeframe={timeframe}
                      onTimeframeChange={setTimeframe}
                      currentQuote={currentQuote}
                    />
                  )}
                  {activeTab === 'info' && (
                    <Suspense fallback={<div className="panel-state secondary">Loading company financials…</div>}>
                        <CompanyInfoView symbol={activeSymbol} />
                    </Suspense>
                  )}
                  {activeTab === 'news' && newsPanel}
                  {activeTab === 'employees' && employees}
                  {activeTab === 'watchlist' && (
                    <div className="watchlist-column">
                      <div className="watchlist-loading">
                        {watchlistLoading ? 'Loading watchlist…' : `Streaming ${watchlistSymbols.length} symbols`}
                      </div>
                      {watchlistNode}
                    </div>
                  )}
                </div>
              </section>
            ) : (
              <div className="desktop-dashboard-layout animate-fade-in">
                <DashboardSidebar
                  activeView={activeView}
                  onViewChange={setActiveView}
                  watchlist={
                    <div className="watchlist-column">
                      <div className="watchlist-loading">
                        {watchlistLoading ? 'Loading watchlist…' : `Streaming ${watchlistSymbols.length} symbols`}
                      </div>
                      {watchlistNode}
                    </div>
                  }
                />
                <div className="desktop-main-content">
                  {activeView === 'graph' ? (
                    <div className="desktop-graph-view-grid">
                      <GraphView
                        symbol={activeSymbol}
                        timeframe={timeframe}
                        onTimeframeChange={setTimeframe}
                        currentQuote={currentQuote}
                      />
                      {newsPanel}
                    </div>
                  ) : (
                    <div className="desktop-company-info-grid">
                      <Suspense fallback={<div className="panel-state secondary">Loading company financials…</div>}>
                          <CompanyInfoView symbol={activeSymbol} />
                      </Suspense>
                      <div className="info-side-widgets">
                        {employees}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}

export default Dashboard
