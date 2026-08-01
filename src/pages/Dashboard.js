import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import Watchlist from '../components/Watchlist';
import StockChart from '../components/StockChart';
const API = import.meta.env.VITE_API_BASE_URL;
const QUOTE_REFRESH_MS = 10_000;
const FUNDAMENTAL_CACHE_MS = 60 * 60 * 1_000;
const INITIAL_WATCHLIST = ['AAPL', 'MSFT', 'TSLA', 'NVDA', 'GOOGL'];
const watchlistNames = {
    AAPL: 'Apple Inc.',
    MSFT: 'Microsoft Corp.',
    TSLA: 'Tesla Inc.',
    NVDA: 'NVIDIA Corp.',
    GOOGL: 'Alphabet Inc.',
};
const currencyFormatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 2,
});
const compactFormatter = new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 2,
});
function normalizeCandles(payload) {
    if (Array.isArray(payload)) {
        return payload
            .map((entry, index) => {
            const item = entry;
            const value = typeof item.close === 'number'
                ? item.close
                : typeof item.value === 'number'
                    ? item.value
                    : typeof item.c === 'number'
                        ? item.c
                        : Number(item.price);
            if (typeof value !== 'number' || Number.isNaN(value)) {
                return null;
            }
            return {
                label: typeof item.label === 'string' ? item.label : `D${index + 1}`,
                value,
            };
        })
            .filter((item) => item !== null);
    }
    if (payload && typeof payload === 'object') {
        const record = payload;
        const closes = Array.isArray(record.c)
            ? record.c.filter((item) => typeof item === 'number')
            : Array.isArray(record.close)
                ? record.close.filter((item) => typeof item === 'number')
                : [];
        const timestamps = Array.isArray(record.t) ? record.t.filter((item) => typeof item === 'number') : [];
        return closes.map((value, index) => ({
            label: timestamps[index] ? new Date(timestamps[index] * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : `D${index + 1}`,
            value,
        }));
    }
    return [];
}
function Dashboard() {
    const [activeSymbol, setActiveSymbol] = useState('AAPL');
    const [watchlistSymbols, setWatchlistSymbols] = useState([...INITIAL_WATCHLIST]);
    const [quoteCache, setQuoteCache] = useState({});
    const [fundamentalCache, setFundamentalCache] = useState({});
    const [watchlistQuotes, setWatchlistQuotes] = useState({});
    const [candles, setCandles] = useState([]);
    const [news, setNews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [watchlistLoading, setWatchlistLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchInput, setSearchInput] = useState('');
    const quoteCacheRef = useRef({});
    const fundamentalCacheRef = useRef({});
    useEffect(() => {
        quoteCacheRef.current = quoteCache;
    }, [quoteCache]);
    useEffect(() => {
        fundamentalCacheRef.current = fundamentalCache;
    }, [fundamentalCache]);
    useEffect(() => {
        const timer = window.setTimeout(() => {
            const normalized = searchInput.trim().toUpperCase();
            if (normalized.length <= 5) {
                setSearchInput(normalized);
            }
        }, 500);
        return () => window.clearTimeout(timer);
    }, [searchInput]);
    const currentQuote = quoteCache[activeSymbol]?.data ?? watchlistQuotes[activeSymbol] ?? null;
    const currentProfile = fundamentalCache[activeSymbol]?.data ?? null;
    const quoteChange = currentQuote ? (currentQuote.percent_change ?? currentQuote.change ?? 0) : 0;
    const isPositive = quoteChange >= 0;
    const topBarColor = isPositive ? '#22c55e' : '#ef4444';
    const fetchJson = async (path) => {
        const response = await fetch(`${API}${path}`);
        if (!response.ok) {
            throw new Error(`Request failed: ${response.status}`);
        }
        return response.json();
    };
    const setQuoteEntry = (symbol, data) => {
        const entry = { data, lastUpdated: Date.now() };
        quoteCacheRef.current = { ...quoteCacheRef.current, [symbol]: entry };
        setQuoteCache(quoteCacheRef.current);
        setWatchlistQuotes((previous) => ({ ...previous, [symbol]: data }));
        return entry;
    };
    const setFundamentalEntry = (symbol, data) => {
        const entry = { data, lastUpdated: Date.now() };
        fundamentalCacheRef.current = { ...fundamentalCacheRef.current, [symbol]: entry };
        setFundamentalCache(fundamentalCacheRef.current);
        return entry;
    };
    const loadQuote = async (symbolToLoad) => {
        const cached = quoteCacheRef.current[symbolToLoad];
        if (cached && Date.now() - cached.lastUpdated < QUOTE_REFRESH_MS) {
            return cached.data;
        }
        try {
            const data = await fetchJson(`/api/quote/${symbolToLoad}`);
            setQuoteEntry(symbolToLoad, data);
            return data;
        }
        catch {
            return null;
        }
    };
    const loadFundamental = async (symbolToLoad) => {
        const cached = fundamentalCacheRef.current[symbolToLoad];
        if (cached && Date.now() - cached.lastUpdated < FUNDAMENTAL_CACHE_MS) {
            return cached.data;
        }
        try {
            const data = await fetchJson(`/api/profile/${symbolToLoad}`);
            setFundamentalEntry(symbolToLoad, data);
            return data;
        }
        catch {
            return null;
        }
    };
    useEffect(() => {
        let active = true;
        const preloadWatchlist = async () => {
            setWatchlistLoading(true);
            setError(null);
            const results = await Promise.allSettled(INITIAL_WATCHLIST.map((symbol) => loadQuote(symbol)));
            if (!active) {
                return;
            }
            const failed = results.filter((result) => result.status === 'rejected' || result.value === null).length;
            if (failed > 0 && !error) {
                setError('Some watchlist quotes are still syncing.');
            }
            setWatchlistLoading(false);
        };
        void preloadWatchlist();
        return () => {
            active = false;
        };
    }, []);
    useEffect(() => {
        let active = true;
        const loadActiveSymbolData = async () => {
            setLoading(true);
            setError(null);
            try {
                const [quoteData, profileData, candlesData, newsData] = await Promise.all([
                    loadQuote(activeSymbol),
                    loadFundamental(activeSymbol),
                    fetchJson(`/api/candles/${activeSymbol}?resolution=D&days=30`),
                    fetchJson(`/api/news/${activeSymbol}`),
                ]);
                if (!active) {
                    return;
                }
                if (!quoteData) {
                    throw new Error('quote failed');
                }
                if (profileData) {
                    setFundamentalEntry(activeSymbol, profileData);
                }
                setCandles(normalizeCandles(candlesData));
                setNews(Array.isArray(newsData) ? newsData.slice(0, 5) : []);
            }
            catch {
                if (active) {
                    setCandles([]);
                    setNews([]);
                    setError('Live market data is temporarily unavailable.');
                }
            }
            finally {
                if (active) {
                    setLoading(false);
                }
            }
        };
        void loadActiveSymbolData();
        return () => {
            active = false;
        };
    }, [activeSymbol]);
    useEffect(() => {
        const id = window.setInterval(() => {
            void Promise.allSettled(watchlistSymbols.map((symbol) => loadQuote(symbol)));
        }, QUOTE_REFRESH_MS);
        return () => window.clearInterval(id);
    }, [watchlistSymbols]);
    const handleSearchSubmit = async (event) => {
        event.preventDefault();
        const normalized = searchInput.trim().toUpperCase();
        if (!normalized || normalized.length > 5) {
            setError('Please enter a valid ticker symbol between 1 and 5 characters.');
            return;
        }
        const quoteData = await loadQuote(normalized);
        if (!quoteData) {
            setError('Unable to load that ticker right now.');
            return;
        }
        setActiveSymbol(normalized);
        setSearchInput('');
        setWatchlistSymbols((previous) => (previous.includes(normalized) ? previous : [...previous, normalized]));
        setError(null);
    };
    const watchlistItems = useMemo(() => {
        return watchlistSymbols.map((symbol) => {
            const quote = watchlistQuotes[symbol] ?? quoteCache[symbol]?.data ?? null;
            const changeValue = quote?.percent_change ?? quote?.change ?? 0;
            const changeText = quote
                ? `${changeValue >= 0 ? '+' : ''}${compactFormatter.format(changeValue)}%`
                : '---';
            const priceText = quote ? currencyFormatter.format(quote.current_price) : '---';
            return {
                symbol,
                name: watchlistNames[symbol] ?? symbol,
                price: watchlistLoading ? '...' : priceText,
                change: watchlistLoading ? 'syncing' : changeText,
                positive: quote ? changeValue >= 0 : true,
            };
        });
    }, [quoteCache, watchlistLoading, watchlistQuotes, watchlistSymbols]);
    const chartValues = candles.length > 0 ? candles.map((entry) => entry.value) : [currentQuote?.current_price ?? 0];
    const chartLabels = candles.length > 0 ? candles.map((entry) => entry.label) : ['Live'];
    return (_jsx("main", { className: "dashboard-page", children: _jsx("div", { className: "dashboard-container", children: _jsxs("div", { className: "dashboard-overlay", children: [_jsxs("header", { className: "product-nav", children: [_jsx(Link, { to: "/", className: "brand", children: "PERSONAL SYSTEMS" }), _jsxs("nav", { children: [_jsx(Link, { to: "/craps", children: "Craps" }), _jsx(Link, { className: "current", to: "/dashboard", children: "Dashboard" })] }), _jsxs("span", { className: "status-badge", children: [_jsx("i", {}), " Market open"] })] }), _jsxs("div", { className: "dashboard-shell", children: [_jsxs("section", { className: "dashboard-topbar", children: [_jsxs("div", { children: [_jsx("p", { className: "eyebrow", children: "MARKET OVERVIEW" }), _jsxs("div", { className: "topbar-symbol-row", children: [_jsx("h1", { children: activeSymbol }), _jsx("span", { children: currentProfile?.name ?? 'Live equity quote' })] })] }), _jsxs("div", { className: "topbar-actions", children: [_jsxs("form", { className: "dashboard-search", onSubmit: handleSearchSubmit, children: [_jsx("input", { type: "text", value: searchInput, onChange: (event) => setSearchInput(event.target.value), placeholder: "Ticker", maxLength: 5 }), _jsx("button", { type: "submit", children: "Search" })] }), _jsxs("div", { className: "topbar-price", children: [_jsx("span", { className: "topbar-label", children: "LAST PRICE" }), _jsx("strong", { children: currentQuote ? currencyFormatter.format(currentQuote.current_price) : '—' }), _jsx("span", { className: "change-pill", style: { color: topBarColor }, children: currentQuote ? `${isPositive ? '+' : ''}${compactFormatter.format(quoteChange)}%` : '—' })] })] })] }), _jsxs("section", { className: "dashboard-grid", children: [_jsxs("div", { className: "watchlist-column", children: [_jsx("div", { className: "watchlist-loading", children: watchlistLoading ? 'Loading watchlist…' : `Streaming ${watchlistSymbols.length} symbols` }), _jsx(Watchlist, { items: watchlistItems, selected: activeSymbol, onSelect: setActiveSymbol })] }), _jsxs("article", { className: "dashboard-main-card", children: [_jsxs("div", { className: "panel-heading", children: [_jsxs("div", { children: [_jsx("p", { className: "eyebrow", children: "PRICE ACTION" }), _jsxs("h2", { children: [activeSymbol, " intraday"] })] }), _jsx("span", { className: "muted-text", children: "USD \u2022 NASDAQ" })] }), loading && !currentQuote ? (_jsx("div", { className: "panel-state", children: "Loading latest market data\u2026" })) : error && !currentQuote ? (_jsx("div", { className: "panel-state", children: error })) : (_jsxs(_Fragment, { children: [_jsx("div", { className: "chart-card", children: _jsx(StockChart, { values: chartValues, labels: chartLabels, positive: isPositive }) }), _jsxs("div", { className: "stats-strip", children: [_jsxs("div", { children: [_jsx("span", { className: "muted-text", children: "Open" }), _jsx("strong", { children: currentQuote?.open ? currencyFormatter.format(currentQuote.open) : '—' })] }), _jsxs("div", { children: [_jsx("span", { className: "muted-text", children: "High" }), _jsx("strong", { children: currentQuote?.high ? currencyFormatter.format(currentQuote.high) : '—' })] }), _jsxs("div", { children: [_jsx("span", { className: "muted-text", children: "Low" }), _jsx("strong", { children: currentQuote?.low ? currencyFormatter.format(currentQuote.low) : '—' })] }), _jsxs("div", { children: [_jsx("span", { className: "muted-text", children: "Prev Close" }), _jsx("strong", { children: currentQuote?.previous_close ? currencyFormatter.format(currentQuote.previous_close) : '—' })] })] })] }))] }), _jsxs("aside", { className: "dashboard-news-card", children: [_jsx("div", { className: "panel-heading", children: _jsxs("div", { children: [_jsx("p", { className: "eyebrow", children: "NEWS" }), _jsx("h2", { children: "Latest headlines" })] }) }), _jsx("div", { className: "news-list", children: news.length > 0 ? news.map((article, index) => (_jsxs("a", { href: article.url, target: "_blank", rel: "noreferrer", className: "news-item", children: [_jsx("span", { className: "news-meta", children: article.source ?? 'Market' }), _jsx("strong", { children: article.headline }), _jsx("span", { className: "news-time", children: article.published ?? 'Now' })] }, `${article.headline}-${index}`))) : (_jsxs("div", { className: "panel-state secondary", children: ["No news available for ", activeSymbol, " right now."] })) })] })] }), _jsxs("section", { className: "dashboard-bottom-grid", children: [_jsxs("article", { className: "dashboard-panel", children: [_jsx("div", { className: "panel-heading compact", children: _jsxs("div", { children: [_jsx("p", { className: "eyebrow", children: "METRICS" }), _jsx("h2", { children: "Key metrics" })] }) }), _jsxs("div", { className: "detail-grid", children: [_jsxs("div", { children: [_jsx("span", { className: "muted-text", children: "Market cap" }), _jsx("strong", { children: currentProfile?.market_cap ? currencyFormatter.format(currentProfile.market_cap) : '—' })] }), _jsxs("div", { children: [_jsx("span", { className: "muted-text", children: "Volume" }), _jsx("strong", { children: currentQuote?.volume ? compactFormatter.format(currentQuote.volume) : '—' })] }), _jsxs("div", { children: [_jsx("span", { className: "muted-text", children: "P/E" }), _jsx("strong", { children: currentQuote?.pe_ratio ? compactFormatter.format(currentQuote.pe_ratio) : '—' })] })] })] }), _jsxs("article", { className: "dashboard-panel", children: [_jsx("div", { className: "panel-heading compact", children: _jsxs("div", { children: [_jsx("p", { className: "eyebrow", children: "RANGE 52W" }), _jsx("h2", { children: "Price range" })] }) }), _jsxs("div", { className: "detail-grid range-card", children: [_jsxs("div", { children: [_jsx("span", { className: "muted-text", children: "High" }), _jsx("strong", { children: currentQuote?.high ? currencyFormatter.format(currentQuote.high) : '—' })] }), _jsxs("div", { children: [_jsx("span", { className: "muted-text", children: "Low" }), _jsx("strong", { children: currentQuote?.low ? currencyFormatter.format(currentQuote.low) : '—' })] })] })] }), _jsxs("article", { className: "dashboard-panel", children: [_jsx("div", { className: "panel-heading compact", children: _jsxs("div", { children: [_jsx("p", { className: "eyebrow", children: "COMPANY" }), _jsx("h2", { children: "Profile" })] }) }), _jsxs("div", { className: "detail-grid", children: [_jsxs("div", { children: [_jsx("span", { className: "muted-text", children: "Name" }), _jsx("strong", { children: currentProfile?.name ?? activeSymbol })] }), _jsxs("div", { children: [_jsx("span", { className: "muted-text", children: "Industry" }), _jsx("strong", { children: currentProfile?.industry ?? '—' })] }), _jsxs("div", { children: [_jsx("span", { className: "muted-text", children: "Country" }), _jsx("strong", { children: currentProfile?.country ?? '—' })] })] })] })] })] })] }) }) }));
}
export default Dashboard;
