import { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import Watchlist, { WatchlistItem } from '../components/Watchlist'
import MainChart, { Timeframe } from '../components/MainChart'
import KpiRing from '../components/KpiRing'

const WordCloud = lazy(() => import('../components/WordCloud'))
const API = import.meta.env.VITE_API_BASE_URL
const QUOTE_REFRESH_MS = 10_000
const FUNDAMENTAL_CACHE_MS = 60 * 60 * 1_000
const INITIAL_WATCHLIST = ['AAPL', 'MSFT', 'TSLA', 'NVDA', 'GOOGL'] as const
const TIMEFRAMES: Timeframe[] = ['1D', '1W', '1M', '6M', '1Y', '5Y', 'MAX']
const employeeKeywords = [
  { word: 'Engineering', frequency: 92 }, { word: 'Innovation', frequency: 81 }, { word: 'Product', frequency: 75 },
  { word: 'Collaboration', frequency: 68 }, { word: 'Leadership', frequency: 59 }, { word: 'Research', frequency: 54 },
  { word: 'Culture', frequency: 47 }, { word: 'Operations', frequency: 42 }, { word: 'Benefits', frequency: 36 },
]

interface QuoteData { symbol: string; current_price: number; percent_change?: number; change?: number; previous_close?: number; high?: number; low?: number; open?: number; volume?: number; market_cap?: number; pe_ratio?: number }
interface ProfileData { name?: string; industry?: string; country?: string; market_cap?: number }
interface NewsItem { headline: string; published?: string; source?: string; url?: string }
interface CacheEntry<T> { data: T; lastUpdated: number }
type MobileTab = 'overview' | 'financials' | 'news' | 'employees' | 'watchlist'

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
  const [activeTab, setActiveTab] = useState<MobileTab>('overview')
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
  const isMobile = useMobileLayout()

  useEffect(() => { quoteCacheRef.current = quoteCache }, [quoteCache])
  useEffect(() => { fundamentalCacheRef.current = fundamentalCache }, [fundamentalCache])
  const fetchJson = async <T,>(path: string): Promise<T> => { const response = await fetch(`${API}${path}`); if (!response.ok) throw new Error(`Request failed: ${response.status}`); return response.json() as Promise<T> }
  const setQuoteEntry = (symbol: string, data: QuoteData) => { const entry = { data, lastUpdated: Date.now() }; quoteCacheRef.current = { ...quoteCacheRef.current, [symbol]: entry }; setQuoteCache(quoteCacheRef.current); setWatchlistQuotes((previous) => ({ ...previous, [symbol]: data })); return entry }
  const setFundamentalEntry = (symbol: string, data: ProfileData) => { const entry = { data, lastUpdated: Date.now() }; fundamentalCacheRef.current = { ...fundamentalCacheRef.current, [symbol]: entry }; setFundamentalCache(fundamentalCacheRef.current); return entry }
  const loadQuote = async (symbol: string) => { const cached = quoteCacheRef.current[symbol]; if (cached && Date.now() - cached.lastUpdated < QUOTE_REFRESH_MS) return cached.data; try { return setQuoteEntry(symbol, await fetchJson<QuoteData>(`/api/quote/${symbol}`)).data } catch { return null } }
  const loadFundamental = async (symbol: string) => { const cached = fundamentalCacheRef.current[symbol]; if (cached && Date.now() - cached.lastUpdated < FUNDAMENTAL_CACHE_MS) return cached.data; try { return setFundamentalEntry(symbol, await fetchJson<ProfileData>(`/api/profile/${symbol}`)).data } catch { return null } }

  useEffect(() => { let current = true; void Promise.allSettled(INITIAL_WATCHLIST.map(loadQuote)).then((results) => { if (!current) return; if (results.some((result) => result.status === 'rejected' || result.value === null)) setError('Some watchlist quotes are still syncing.'); setWatchlistLoading(false) }); return () => { current = false } }, [])
  useEffect(() => { let current = true; setLoading(true); setError(null); void Promise.all([loadQuote(activeSymbol), loadFundamental(activeSymbol), fetchJson<NewsItem[]>(`/api/news/${activeSymbol}`)]).then(([quote, , articles]) => { if (!current) return; if (!quote) throw new Error(); setNews(Array.isArray(articles) ? articles.slice(0, 5) : []) }).catch(() => { if (current) { setNews([]); setError('Live market data is temporarily unavailable.') } }).finally(() => { if (current) setLoading(false) }); return () => { current = false } }, [activeSymbol])
  useEffect(() => { const id = window.setInterval(() => { void Promise.allSettled(watchlistSymbols.map(loadQuote)) }, QUOTE_REFRESH_MS); return () => window.clearInterval(id) }, [watchlistSymbols])

  const currentQuote = quoteCache[activeSymbol]?.data ?? watchlistQuotes[activeSymbol] ?? null
  const currentProfile = fundamentalCache[activeSymbol]?.data ?? null
  const quoteChange = currentQuote?.percent_change ?? currentQuote?.change ?? 0
  const isPositive = quoteChange >= 0
  const watchlistItems = useMemo<WatchlistItem[]>(() => watchlistSymbols.map((symbol) => { const quote = watchlistQuotes[symbol] ?? quoteCache[symbol]?.data; const change = quote?.percent_change ?? quote?.change ?? 0; return { symbol, name: watchlistNames[symbol] ?? symbol, price: watchlistLoading ? '...' : quote ? currencyFormatter.format(quote.current_price) : '---', change: watchlistLoading ? 'syncing' : quote ? `${change >= 0 ? '+' : ''}${compactFormatter.format(change)}%` : '---', positive: change >= 0 } }), [quoteCache, watchlistLoading, watchlistQuotes, watchlistSymbols])
  const submitSearch = async (event: React.FormEvent<HTMLFormElement>) => { event.preventDefault(); const symbol = searchInput.trim().toUpperCase(); if (!symbol || symbol.length > 5) { setError('Please enter a valid ticker symbol between 1 and 5 characters.'); return } if (!await loadQuote(symbol)) { setError('Unable to load that ticker right now.'); return } setActiveSymbol(symbol); setSearchInput(''); setWatchlistSymbols((previous) => previous.includes(symbol) ? previous : [...previous, symbol]); setError(null) }
  const selectSymbol = (symbol: string) => { setActiveSymbol(symbol); setActiveTab('overview') }

  const timeframeSelector = <div className="timeframe-selector" role="group" aria-label="Chart timeframe">{TIMEFRAMES.map((item) => <button key={item} type="button" className={timeframe === item ? 'active' : ''} onClick={() => setTimeframe(item)}>{item}</button>)}</div>
  const chart = <article className="dashboard-main-card"><div className="panel-heading"><div><p className="eyebrow">PRICE ACTION</p><h2>{activeSymbol} historical</h2></div><span className="muted-text">USD • NASDAQ</span></div><div className="chart-card"><MainChart symbol={activeSymbol} timeframe={timeframe} /></div>{timeframeSelector}<div className="stats-strip"><Metric label="Open" value={currentQuote?.open} /><Metric label="High" value={currentQuote?.high} /><Metric label="Low" value={currentQuote?.low} /><Metric label="Prev Close" value={currentQuote?.previous_close} /></div></article>
  const financials = <><article className="dashboard-panel metrics-panel"><PanelHeader eyebrow="METRICS" title="Key metrics" /><div className="detail-grid"><Detail label="Market cap" value={currentProfile?.market_cap ? currencyFormatter.format(currentProfile.market_cap) : '—'} /><Detail label="Volume" value={currentQuote?.volume ? compactFormatter.format(currentQuote.volume) : '—'} /><Detail label="P/E" value={currentQuote?.pe_ratio ? compactFormatter.format(currentQuote.pe_ratio) : '—'} /></div></article><article className="dashboard-panel range-panel"><PanelHeader eyebrow="RANGE 52W" title="Price range" /><div className="detail-grid range-card"><Detail label="High" value={currentQuote?.high ? currencyFormatter.format(currentQuote.high) : '—'} /><Detail label="Low" value={currentQuote?.low ? currencyFormatter.format(currentQuote.low) : '—'} /></div></article><article className="dashboard-panel profile-panel"><PanelHeader eyebrow="COMPANY" title="Profile" /><div className="detail-grid"><Detail label="Name" value={currentProfile?.name ?? activeSymbol} /><Detail label="Industry" value={currentProfile?.industry ?? '—'} /><Detail label="Country" value={currentProfile?.country ?? '—'} /></div></article></>
  const overview = <article className="dashboard-panel kpi-panel"><PanelHeader eyebrow="OVERVIEW" title="Growth indicators" /><div className="kpi-rings"><KpiRing label="Revenue Growth" value={Math.abs(Math.round(quoteChange * 3))} /><KpiRing label="Earnings Growth" value={Math.abs(Math.round(quoteChange * 2.4))} /><KpiRing label="Profit Margin" value={Math.min(100, Math.round((currentQuote?.pe_ratio ?? 20) * 1.1))} /></div></article>
  const newsPanel = <aside className="dashboard-news-card"><PanelHeader eyebrow="NEWS" title="Latest headlines" /><div className="news-list">{news.length ? news.map((article, index) => <a href={article.url} target="_blank" rel="noreferrer" className="news-item" key={`${article.headline}-${index}`}><span className="news-meta">{article.source ?? 'Market'}</span><strong>{article.headline}</strong><span className="news-time">{article.published ?? 'Now'}</span></a>) : <div className="panel-state secondary">No news available for {activeSymbol} right now.</div>}</div></aside>
  const employees = <article className="dashboard-panel employees-panel"><PanelHeader eyebrow="EMPLOYEES" title="Workforce themes" /><Suspense fallback={<div className="panel-state secondary">Loading employee themes…</div>}><WordCloud words={employeeKeywords} /></Suspense></article>

  return <main className="dashboard-page"><div className="dashboard-container"><div className="dashboard-overlay"><header className="product-nav"><Link to="/" className="brand">PERSONAL SYSTEMS</Link><nav><Link to="/craps">Craps</Link><Link className="current" to="/dashboard">Dashboard</Link></nav><span className="status-badge"><i /> Market open</span></header><div className="dashboard-shell"><section className="dashboard-topbar"><div><p className="eyebrow">MARKET OVERVIEW</p><div className="topbar-symbol-row"><h1>{activeSymbol}</h1><span>{currentProfile?.name ?? 'Live equity quote'}</span></div></div><div className="topbar-actions"><form className="dashboard-search" onSubmit={submitSearch}><input value={searchInput} onChange={(event) => setSearchInput(event.target.value)} placeholder="Ticker" maxLength={5} /><button type="submit">Search</button></form><div className="topbar-price"><span className="topbar-label">LAST PRICE</span><strong>{currentQuote ? currencyFormatter.format(currentQuote.current_price) : '—'}</strong><span className={`change-pill ${isPositive ? 'positive' : 'negative'}`}>{currentQuote ? `${isPositive ? '+' : ''}${compactFormatter.format(quoteChange)}%` : '—'}</span></div></div></section>{error && !loading && <div className="dashboard-inline-error">{error}</div>}{isMobile ? <section className="mobile-dashboard">{chart}<div className="mobile-tab-strip" role="tablist">{(['overview', 'financials', 'news', 'employees', 'watchlist'] as MobileTab[]).map((tab) => <button key={tab} type="button" role="tab" aria-selected={activeTab === tab} className={activeTab === tab ? 'active' : ''} onClick={() => setActiveTab(tab)}>{tab}</button>)}</div><div className="mobile-tab-panel">{activeTab === 'overview' && overview}{activeTab === 'financials' && <div className="mobile-financials">{financials}</div>}{activeTab === 'news' && newsPanel}{activeTab === 'employees' && employees}{activeTab === 'watchlist' && <div className="watchlist-column"><div className="watchlist-loading">{watchlistLoading ? 'Loading watchlist…' : `Streaming ${watchlistSymbols.length} symbols`}</div><Watchlist items={watchlistItems} selected={activeSymbol} onSelect={selectSymbol} /></div>}</div></section> : <><section className="dashboard-grid"><div className="watchlist-column"><div className="watchlist-loading">{watchlistLoading ? 'Loading watchlist…' : `Streaming ${watchlistSymbols.length} symbols`}</div><Watchlist items={watchlistItems} selected={activeSymbol} onSelect={selectSymbol} /></div>{chart}{newsPanel}</section><section className="dashboard-bottom-grid">{financials}</section></>}</div></div></div></main>
}

function PanelHeader({ eyebrow, title }: { eyebrow: string; title: string }) { return <div className="panel-heading compact"><div><p className="eyebrow">{eyebrow}</p><h2>{title}</h2></div></div> }
function Detail({ label, value }: { label: string; value: string }) { return <div><span className="muted-text">{label}</span><strong>{value}</strong></div> }
function Metric({ label, value }: { label: string; value?: number }) { return <Detail label={label} value={value ? currencyFormatter.format(value) : '—'} /> }

export default Dashboard
