import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import Watchlist from '../components/Watchlist';
import DashboardSidebar from '../components/DashboardSidebar';
import GraphView from '../components/GraphView';
const WordCloud = lazy(() => import('../components/WordCloud'));
const CompanyInfoView = lazy(() => import('../components/CompanyInfoView'));
const API = import.meta.env.VITE_API_BASE_URL;
const QUOTE_REFRESH_MS = 10_000;
const FUNDAMENTAL_CACHE_MS = 60 * 60 * 1_000;
const INITIAL_WATCHLIST = ['AAPL', 'MSFT', 'TSLA', 'NVDA', 'GOOGL'];
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
    const [activeTab, setActiveTab] = useState('graph');
    const [activeView, setActiveView] = useState('graph');
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
    const activeSymbolRef = useRef('AAPL');
    const isMobile = useMobileLayout();
    useEffect(() => { quoteCacheRef.current = quoteCache; }, [quoteCache]);
    useEffect(() => { fundamentalCacheRef.current = fundamentalCache; }, [fundamentalCache]);
    const fetchJson = async (path) => { const response = await fetch(`${API}${path}`); if (!response.ok)
        throw new Error(`Request failed: ${response.status}`); return response.json(); };
    const setQuoteEntry = (symbol, data) => { const entry = { data, lastUpdated: Date.now() }; quoteCacheRef.current = { ...quoteCacheRef.current, [symbol]: entry }; setQuoteCache(quoteCacheRef.current); setWatchlistQuotes((previous) => ({ ...previous, [symbol]: data })); return entry; };
    const setFundamentalEntry = (symbol, data) => { const entry = { data, lastUpdated: Date.now() }; fundamentalCacheRef.current = { ...fundamentalCacheRef.current, [symbol]: entry }; setFundamentalCache(fundamentalCacheRef.current); return entry; };
    const loadQuote = async (symbol, forceRefresh = false) => { const cached = quoteCacheRef.current[symbol]; if (!forceRefresh && cached && Date.now() - cached.lastUpdated < QUOTE_REFRESH_MS)
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
    useEffect(() => { let current = true; void Promise.allSettled(INITIAL_WATCHLIST.map((s) => loadQuote(s))).then((results) => { if (!current)
        return; if (results.some((result) => result.status === 'rejected' || result.value === null))
        setError('Some watchlist quotes are still syncing.'); setWatchlistLoading(false); }); return () => { current = false; }; }, []);
    useEffect(() => {
        let current = true;
        activeSymbolRef.current = activeSymbol;
        setLoading(true);
        setError(null);
        // Force-refresh quote for newly selected symbol so data is never stale
        void Promise.all([loadQuote(activeSymbol, true), loadFundamental(activeSymbol), fetchJson(`/api/news/${activeSymbol}`)])
            .then(([quote, , articles]) => { if (!current)
            return; if (!quote)
            throw new Error(); setNews(Array.isArray(articles) ? articles.slice(0, 5) : []); })
            .catch(() => { if (current) {
            setNews([]);
            setError('Live market data is temporarily unavailable.');
        } })
            .finally(() => { if (current)
            setLoading(false); });
        return () => { current = false; };
    }, [activeSymbol]);
    // Poll ALL watchlist symbols + active symbol every 10s
    useEffect(() => {
        const id = window.setInterval(() => {
            const allSymbols = Array.from(new Set([activeSymbolRef.current, ...watchlistSymbols]));
            void Promise.allSettled(allSymbols.map((s) => loadQuote(s, true)));
        }, QUOTE_REFRESH_MS);
        return () => window.clearInterval(id);
    }, [watchlistSymbols]);
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
    const selectSymbol = (symbol) => { setActiveSymbol(symbol); setActiveTab('graph'); setActiveView('graph'); };
    const newsPanel = _jsxs("aside", { className: "dashboard-news-card", children: [_jsx("div", { className: "panel-heading compact", children: _jsxs("div", { children: [_jsx("p", { className: "eyebrow", children: "NEWS" }), _jsx("h2", { children: "Latest headlines" })] }) }), _jsx("div", { className: "news-list", children: news.length ? news.map((article, index) => _jsxs("a", { href: article.url, target: "_blank", rel: "noreferrer", className: "news-item", children: [_jsx("span", { className: "news-meta", children: article.source ?? 'Market' }), _jsx("strong", { children: article.headline }), _jsx("span", { className: "news-time", children: article.published ?? 'Now' })] }, `${article.headline}-${index}`)) : _jsxs("div", { className: "panel-state secondary", children: ["No news available for ", activeSymbol, " right now."] }) })] });
    const employees = _jsxs("article", { className: "dashboard-panel employees-panel", children: [_jsx("div", { className: "panel-heading compact", children: _jsxs("div", { children: [_jsx("p", { className: "eyebrow", children: "EMPLOYEES" }), _jsx("h2", { children: "Workforce themes" })] }) }), _jsx(Suspense, { fallback: _jsx("div", { className: "panel-state secondary", children: "Loading employee themes\u2026" }), children: _jsx(WordCloud, { words: employeeKeywords }) })] });
    const watchlistNode = (_jsx(Watchlist, { items: watchlistItems, selected: activeSymbol, onSelect: selectSymbol }));
    return (_jsx("main", { className: "dashboard-page", children: _jsx("div", { className: "dashboard-container", children: _jsxs("div", { className: "dashboard-overlay", children: [_jsxs("header", { className: "product-nav", children: [_jsx(Link, { to: "/", className: "brand", children: "PERSONAL SYSTEMS" }), _jsxs("nav", { children: [_jsx(Link, { to: "/craps", children: "Craps" }), _jsx(Link, { className: "current", to: "/dashboard", children: "Dashboard" })] }), _jsxs("span", { className: "status-badge", children: [_jsx("i", {}), " Market open"] })] }), _jsxs("div", { className: "dashboard-shell", children: [_jsxs("section", { className: "dashboard-topbar", children: [_jsxs("div", { children: [_jsx("p", { className: "eyebrow", children: "MARKET OVERVIEW" }), _jsxs("div", { className: "topbar-symbol-row", children: [_jsx("h1", { children: activeSymbol }), _jsx("span", { children: currentProfile?.name ?? 'Live equity quote' })] })] }), _jsxs("div", { className: "topbar-actions", children: [_jsxs("form", { className: "dashboard-search", onSubmit: submitSearch, children: [_jsx("input", { value: searchInput, onChange: (event) => setSearchInput(event.target.value), placeholder: "Ticker", maxLength: 5 }), _jsx("button", { type: "submit", children: "Search" })] }), _jsxs("div", { className: "topbar-price", children: [_jsx("span", { className: "topbar-label", children: "LAST PRICE" }), _jsx("strong", { style: { fontSize: '36px', fontWeight: 700, color: '#ffffff', lineHeight: 1.1 }, children: currentQuote ? currencyFormatter.format(currentQuote.current_price) : _jsx("span", { style: { color: '#6b7280' }, children: "n/a" }) }), _jsx("span", { className: `change-pill ${isPositive ? 'positive' : 'negative'}`, style: { fontSize: '16px', fontWeight: 600, color: isPositive ? '#22c55e' : '#ef4444' }, children: currentQuote ? `${isPositive ? '+' : ''}${compactFormatter.format(quoteChange)}%` : _jsx("span", { style: { color: '#6b7280' }, children: "n/a" }) })] })] })] }), error && !loading && _jsx("div", { className: "dashboard-inline-error", children: error }), isMobile ? (_jsxs("section", { className: "mobile-dashboard", children: [_jsx("div", { className: "mobile-tab-strip", role: "tablist", children: ['graph', 'info', 'watchlist', 'news', 'employees'].map((tab) => (_jsx("button", { type: "button", role: "tab", "aria-selected": activeTab === tab, className: activeTab === tab ? 'active' : '', onClick: () => setActiveTab(tab), children: tab === 'info' ? 'Company Info' : tab.toUpperCase() }, tab))) }), _jsxs("div", { className: "mobile-tab-panel animate-fade-in", children: [activeTab === 'graph' && (_jsx(GraphView, { symbol: activeSymbol, timeframe: timeframe, onTimeframeChange: setTimeframe, currentQuote: currentQuote })), activeTab === 'info' && (_jsx(Suspense, { fallback: _jsx("div", { className: "panel-state secondary", children: "Loading company financials\u2026" }), children: _jsx(CompanyInfoView, { symbol: activeSymbol }) })), activeTab === 'news' && newsPanel, activeTab === 'employees' && employees, activeTab === 'watchlist' && (_jsxs("div", { className: "watchlist-column", children: [_jsx("div", { className: "watchlist-loading", children: watchlistLoading ? 'Loading watchlist…' : `Streaming ${watchlistSymbols.length} symbols` }), watchlistNode] }))] })] })) : (_jsxs("div", { className: "desktop-dashboard-layout animate-fade-in", children: [_jsx(DashboardSidebar, { activeView: activeView, onViewChange: setActiveView, watchlist: _jsxs("div", { className: "watchlist-column", children: [_jsx("div", { className: "watchlist-loading", children: watchlistLoading ? 'Loading watchlist…' : `Streaming ${watchlistSymbols.length} symbols` }), watchlistNode] }) }), _jsx("div", { className: "desktop-main-content", children: activeView === 'graph' ? (_jsxs("div", { className: "desktop-graph-view-grid", children: [_jsx(GraphView, { symbol: activeSymbol, timeframe: timeframe, onTimeframeChange: setTimeframe, currentQuote: currentQuote }), newsPanel] })) : (_jsxs("div", { className: "desktop-company-info-grid", children: [_jsx(Suspense, { fallback: _jsx("div", { className: "panel-state secondary", children: "Loading company financials\u2026" }), children: _jsx(CompanyInfoView, { symbol: activeSymbol }) }), _jsx("div", { className: "info-side-widgets", children: employees })] })) })] })), _jsx("div", { style: {
                                    fontSize: '11px',
                                    color: '#6b7280',
                                    textAlign: 'right',
                                    padding: '12px 4px 4px',
                                    fontFamily: 'Inter, system-ui, sans-serif',
                                }, children: (() => {
                                    const now = new Date();
                                    const y = now.getFullYear();
                                    const m = String(now.getMonth() + 1).padStart(2, '0');
                                    const d = String(now.getDate()).padStart(2, '0');
                                    const hh = String(now.getHours()).padStart(2, '0');
                                    const mm = String(now.getMinutes()).padStart(2, '0');
                                    return `Updated: ${y}-${m}-${d} ${hh}:${mm} ET`;
                                })() })] })] }) }) }));
}
export default Dashboard;
