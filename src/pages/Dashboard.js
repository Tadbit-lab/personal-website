import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import Watchlist from '../components/Watchlist';
import MainChart from '../components/MainChart';
import KpiRing from '../components/KpiRing';
const WordCloud = lazy(() => import('../components/WordCloud'));
const API = import.meta.env.VITE_API_BASE_URL;
const QUOTE_REFRESH_MS = 10_000;
const FUNDAMENTAL_CACHE_MS = 60 * 60 * 1_000;
const INITIAL_WATCHLIST = ['AAPL', 'MSFT', 'TSLA', 'NVDA', 'GOOGL'];
const TIMEFRAMES = ['1D', '1W', '1M', '6M', '1Y', '5Y', 'MAX'];
const employeeKeywords = [
    { word: 'Engineering', frequency: 92 }, { word: 'Innovation', frequency: 81 }, { word: 'Product', frequency: 75 },
    { word: 'Collaboration', frequency: 68 }, { word: 'Leadership', frequency: 59 }, { word: 'Research', frequency: 54 },
    { word: 'Culture', frequency: 47 }, { word: 'Operations', frequency: 42 }, { word: 'Benefits', frequency: 36 },
];
const watchlistNames = { AAPL: 'Apple Inc.', MSFT: 'Microsoft Corp.', TSLA: 'Tesla Inc.', NVDA: 'NVIDIA Corp.', GOOGL: 'Alphabet Inc.' };
const currencyFormatter = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 });
const compactFormatter = new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 });
function useMobileLayout() {
    const [mobile, setMobile] = useState(() => window.matchMedia('(max-width: 767.98px)').matches);
    useEffect(() => { const query = window.matchMedia('(max-width: 767.98px)'); const update = () => setMobile(query.matches); update(); query.addEventListener('change', update); return () => query.removeEventListener('change', update); }, []);
    return mobile;
}
function Dashboard() {
    const [activeSymbol, setActiveSymbol] = useState('AAPL');
    const [timeframe, setTimeframe] = useState('1Y');
    const [activeTab, setActiveTab] = useState('overview');
    const [watchlistSymbols, setWatchlistSymbols] = useState([...INITIAL_WATCHLIST]);
    const [quoteCache, setQuoteCache] = useState({});
    const [fundamentalCache, setFundamentalCache] = useState({});
    const [watchlistQuotes, setWatchlistQuotes] = useState({});
    const [news, setNews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [watchlistLoading, setWatchlistLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchInput, setSearchInput] = useState('');
    const quoteCacheRef = useRef({});
    const fundamentalCacheRef = useRef({});
    const isMobile = useMobileLayout();
    useEffect(() => { quoteCacheRef.current = quoteCache; }, [quoteCache]);
    useEffect(() => { fundamentalCacheRef.current = fundamentalCache; }, [fundamentalCache]);
    const fetchJson = async (path) => { const response = await fetch(`${API}${path}`); if (!response.ok)
        throw new Error(`Request failed: ${response.status}`); return response.json(); };
    const setQuoteEntry = (symbol, data) => { const entry = { data, lastUpdated: Date.now() }; quoteCacheRef.current = { ...quoteCacheRef.current, [symbol]: entry }; setQuoteCache(quoteCacheRef.current); setWatchlistQuotes((previous) => ({ ...previous, [symbol]: data })); return entry; };
    const setFundamentalEntry = (symbol, data) => { const entry = { data, lastUpdated: Date.now() }; fundamentalCacheRef.current = { ...fundamentalCacheRef.current, [symbol]: entry }; setFundamentalCache(fundamentalCacheRef.current); return entry; };
    const loadQuote = async (symbol) => { const cached = quoteCacheRef.current[symbol]; if (cached && Date.now() - cached.lastUpdated < QUOTE_REFRESH_MS)
        return cached.data; try {
        return setQuoteEntry(symbol, await fetchJson(`/api/quote/${symbol}`)).data;
    }
    catch {
        return null;
    } };
    const loadFundamental = async (symbol) => { const cached = fundamentalCacheRef.current[symbol]; if (cached && Date.now() - cached.lastUpdated < FUNDAMENTAL_CACHE_MS)
        return cached.data; try {
        return setFundamentalEntry(symbol, await fetchJson(`/api/profile/${symbol}`)).data;
    }
    catch {
        return null;
    } };
    useEffect(() => { let current = true; void Promise.allSettled(INITIAL_WATCHLIST.map(loadQuote)).then((results) => { if (!current)
        return; if (results.some((result) => result.status === 'rejected' || result.value === null))
        setError('Some watchlist quotes are still syncing.'); setWatchlistLoading(false); }); return () => { current = false; }; }, []);
    useEffect(() => { let current = true; setLoading(true); setError(null); void Promise.all([loadQuote(activeSymbol), loadFundamental(activeSymbol), fetchJson(`/api/news/${activeSymbol}`)]).then(([quote, , articles]) => { if (!current)
        return; if (!quote)
        throw new Error(); setNews(Array.isArray(articles) ? articles.slice(0, 5) : []); }).catch(() => { if (current) {
        setNews([]);
        setError('Live market data is temporarily unavailable.');
    } }).finally(() => { if (current)
        setLoading(false); }); return () => { current = false; }; }, [activeSymbol]);
    useEffect(() => { const id = window.setInterval(() => { void Promise.allSettled(watchlistSymbols.map(loadQuote)); }, QUOTE_REFRESH_MS); return () => window.clearInterval(id); }, [watchlistSymbols]);
    const currentQuote = quoteCache[activeSymbol]?.data ?? watchlistQuotes[activeSymbol] ?? null;
    const currentProfile = fundamentalCache[activeSymbol]?.data ?? null;
    const quoteChange = currentQuote?.percent_change ?? currentQuote?.change ?? 0;
    const isPositive = quoteChange >= 0;
    const watchlistItems = useMemo(() => watchlistSymbols.map((symbol) => { const quote = watchlistQuotes[symbol] ?? quoteCache[symbol]?.data; const change = quote?.percent_change ?? quote?.change ?? 0; return { symbol, name: watchlistNames[symbol] ?? symbol, price: watchlistLoading ? '...' : quote ? currencyFormatter.format(quote.current_price) : '---', change: watchlistLoading ? 'syncing' : quote ? `${change >= 0 ? '+' : ''}${compactFormatter.format(change)}%` : '---', positive: change >= 0 }; }), [quoteCache, watchlistLoading, watchlistQuotes, watchlistSymbols]);
    const submitSearch = async (event) => { event.preventDefault(); const symbol = searchInput.trim().toUpperCase(); if (!symbol || symbol.length > 5) {
        setError('Please enter a valid ticker symbol between 1 and 5 characters.');
        return;
    } if (!await loadQuote(symbol)) {
        setError('Unable to load that ticker right now.');
        return;
    } setActiveSymbol(symbol); setSearchInput(''); setWatchlistSymbols((previous) => previous.includes(symbol) ? previous : [...previous, symbol]); setError(null); };
    const selectSymbol = (symbol) => { setActiveSymbol(symbol); setActiveTab('overview'); };
    const timeframeSelector = _jsx("div", { className: "timeframe-selector", role: "group", "aria-label": "Chart timeframe", children: TIMEFRAMES.map((item) => _jsx("button", { type: "button", className: timeframe === item ? 'active' : '', onClick: () => setTimeframe(item), children: item }, item)) });
    const chart = _jsxs("article", { className: "dashboard-main-card", children: [_jsxs("div", { className: "panel-heading", children: [_jsxs("div", { children: [_jsx("p", { className: "eyebrow", children: "PRICE ACTION" }), _jsxs("h2", { children: [activeSymbol, " historical"] })] }), _jsx("span", { className: "muted-text", children: "USD \u2022 NASDAQ" })] }), _jsx("div", { className: "chart-card", children: _jsx(MainChart, { symbol: activeSymbol, timeframe: timeframe }) }), timeframeSelector, _jsxs("div", { className: "stats-strip", children: [_jsx(Metric, { label: "Open", value: currentQuote?.open }), _jsx(Metric, { label: "High", value: currentQuote?.high }), _jsx(Metric, { label: "Low", value: currentQuote?.low }), _jsx(Metric, { label: "Prev Close", value: currentQuote?.previous_close })] })] });
    const financials = _jsxs(_Fragment, { children: [_jsxs("article", { className: "dashboard-panel metrics-panel", children: [_jsx(PanelHeader, { eyebrow: "METRICS", title: "Key metrics" }), _jsxs("div", { className: "detail-grid", children: [_jsx(Detail, { label: "Market cap", value: currentProfile?.market_cap ? currencyFormatter.format(currentProfile.market_cap) : '—' }), _jsx(Detail, { label: "Volume", value: currentQuote?.volume ? compactFormatter.format(currentQuote.volume) : '—' }), _jsx(Detail, { label: "P/E", value: currentQuote?.pe_ratio ? compactFormatter.format(currentQuote.pe_ratio) : '—' })] })] }), _jsxs("article", { className: "dashboard-panel range-panel", children: [_jsx(PanelHeader, { eyebrow: "RANGE 52W", title: "Price range" }), _jsxs("div", { className: "detail-grid range-card", children: [_jsx(Detail, { label: "High", value: currentQuote?.high ? currencyFormatter.format(currentQuote.high) : '—' }), _jsx(Detail, { label: "Low", value: currentQuote?.low ? currencyFormatter.format(currentQuote.low) : '—' })] })] }), _jsxs("article", { className: "dashboard-panel profile-panel", children: [_jsx(PanelHeader, { eyebrow: "COMPANY", title: "Profile" }), _jsxs("div", { className: "detail-grid", children: [_jsx(Detail, { label: "Name", value: currentProfile?.name ?? activeSymbol }), _jsx(Detail, { label: "Industry", value: currentProfile?.industry ?? '—' }), _jsx(Detail, { label: "Country", value: currentProfile?.country ?? '—' })] })] })] });
    const overview = _jsxs("article", { className: "dashboard-panel kpi-panel", children: [_jsx(PanelHeader, { eyebrow: "OVERVIEW", title: "Growth indicators" }), _jsxs("div", { className: "kpi-rings", children: [_jsx(KpiRing, { label: "Revenue Growth", value: Math.abs(Math.round(quoteChange * 3)) }), _jsx(KpiRing, { label: "Earnings Growth", value: Math.abs(Math.round(quoteChange * 2.4)) }), _jsx(KpiRing, { label: "Profit Margin", value: Math.min(100, Math.round((currentQuote?.pe_ratio ?? 20) * 1.1)) })] })] });
    const newsPanel = _jsxs("aside", { className: "dashboard-news-card", children: [_jsx(PanelHeader, { eyebrow: "NEWS", title: "Latest headlines" }), _jsx("div", { className: "news-list", children: news.length ? news.map((article, index) => _jsxs("a", { href: article.url, target: "_blank", rel: "noreferrer", className: "news-item", children: [_jsx("span", { className: "news-meta", children: article.source ?? 'Market' }), _jsx("strong", { children: article.headline }), _jsx("span", { className: "news-time", children: article.published ?? 'Now' })] }, `${article.headline}-${index}`)) : _jsxs("div", { className: "panel-state secondary", children: ["No news available for ", activeSymbol, " right now."] }) })] });
    const employees = _jsxs("article", { className: "dashboard-panel employees-panel", children: [_jsx(PanelHeader, { eyebrow: "EMPLOYEES", title: "Workforce themes" }), _jsx(Suspense, { fallback: _jsx("div", { className: "panel-state secondary", children: "Loading employee themes\u2026" }), children: _jsx(WordCloud, { words: employeeKeywords }) })] });
    return _jsx("main", { className: "dashboard-page", children: _jsx("div", { className: "dashboard-container", children: _jsxs("div", { className: "dashboard-overlay", children: [_jsxs("header", { className: "product-nav", children: [_jsx(Link, { to: "/", className: "brand", children: "PERSONAL SYSTEMS" }), _jsxs("nav", { children: [_jsx(Link, { to: "/craps", children: "Craps" }), _jsx(Link, { className: "current", to: "/dashboard", children: "Dashboard" })] }), _jsxs("span", { className: "status-badge", children: [_jsx("i", {}), " Market open"] })] }), _jsxs("div", { className: "dashboard-shell", children: [_jsxs("section", { className: "dashboard-topbar", children: [_jsxs("div", { children: [_jsx("p", { className: "eyebrow", children: "MARKET OVERVIEW" }), _jsxs("div", { className: "topbar-symbol-row", children: [_jsx("h1", { children: activeSymbol }), _jsx("span", { children: currentProfile?.name ?? 'Live equity quote' })] })] }), _jsxs("div", { className: "topbar-actions", children: [_jsxs("form", { className: "dashboard-search", onSubmit: submitSearch, children: [_jsx("input", { value: searchInput, onChange: (event) => setSearchInput(event.target.value), placeholder: "Ticker", maxLength: 5 }), _jsx("button", { type: "submit", children: "Search" })] }), _jsxs("div", { className: "topbar-price", children: [_jsx("span", { className: "topbar-label", children: "LAST PRICE" }), _jsx("strong", { children: currentQuote ? currencyFormatter.format(currentQuote.current_price) : '—' }), _jsx("span", { className: `change-pill ${isPositive ? 'positive' : 'negative'}`, children: currentQuote ? `${isPositive ? '+' : ''}${compactFormatter.format(quoteChange)}%` : '—' })] })] })] }), error && !loading && _jsx("div", { className: "dashboard-inline-error", children: error }), isMobile ? _jsxs("section", { className: "mobile-dashboard", children: [chart, _jsx("div", { className: "mobile-tab-strip", role: "tablist", children: ['overview', 'financials', 'news', 'employees', 'watchlist'].map((tab) => _jsx("button", { type: "button", role: "tab", "aria-selected": activeTab === tab, className: activeTab === tab ? 'active' : '', onClick: () => setActiveTab(tab), children: tab }, tab)) }), _jsxs("div", { className: "mobile-tab-panel", children: [activeTab === 'overview' && overview, activeTab === 'financials' && _jsx("div", { className: "mobile-financials", children: financials }), activeTab === 'news' && newsPanel, activeTab === 'employees' && employees, activeTab === 'watchlist' && _jsxs("div", { className: "watchlist-column", children: [_jsx("div", { className: "watchlist-loading", children: watchlistLoading ? 'Loading watchlist…' : `Streaming ${watchlistSymbols.length} symbols` }), _jsx(Watchlist, { items: watchlistItems, selected: activeSymbol, onSelect: selectSymbol })] })] })] }) : _jsxs(_Fragment, { children: [_jsxs("section", { className: "dashboard-grid", children: [_jsxs("div", { className: "watchlist-column", children: [_jsx("div", { className: "watchlist-loading", children: watchlistLoading ? 'Loading watchlist…' : `Streaming ${watchlistSymbols.length} symbols` }), _jsx(Watchlist, { items: watchlistItems, selected: activeSymbol, onSelect: selectSymbol })] }), chart, newsPanel] }), _jsx("section", { className: "dashboard-bottom-grid", children: financials })] })] })] }) }) });
}
function PanelHeader({ eyebrow, title }) { return _jsx("div", { className: "panel-heading compact", children: _jsxs("div", { children: [_jsx("p", { className: "eyebrow", children: eyebrow }), _jsx("h2", { children: title })] }) }); }
function Detail({ label, value }) { return _jsxs("div", { children: [_jsx("span", { className: "muted-text", children: label }), _jsx("strong", { children: value })] }); }
function Metric({ label, value }) { return _jsx(Detail, { label: label, value: value ? currencyFormatter.format(value) : '—' }); }
export default Dashboard;
