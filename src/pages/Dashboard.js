import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import Watchlist from '../components/Watchlist';
import StockChart from '../components/StockChart';
const API = import.meta.env.VITE_API_BASE_URL;
const watchlist = [
    { symbol: 'AAPL', name: 'Apple Inc.', price: '---', change: '---', positive: true },
    { symbol: 'MSFT', name: 'Microsoft Corp.', price: '---', change: '---', positive: true },
    { symbol: 'NVDA', name: 'NVIDIA Corp.', price: '---', change: '---', positive: true },
    { symbol: 'TSLA', name: 'Tesla Inc.', price: '---', change: '---', positive: false },
    { symbol: 'AMZN', name: 'Amazon.com', price: '---', change: '---', positive: true },
];
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
    const [symbol, setSymbol] = useState('AAPL');
    const [quote, setQuote] = useState(null);
    const [profile, setProfile] = useState(null);
    const [candles, setCandles] = useState([]);
    const [news, setNews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const quoteChange = quote ? (quote.percent_change ?? quote.change ?? 0) : 0;
    const isPositive = quoteChange >= 0;
    const topBarColor = isPositive ? '#22c55e' : '#ef4444';
    const fetchJson = async (path) => {
        const response = await fetch(`${API}${path}`);
        if (!response.ok) {
            throw new Error(`Request failed: ${response.status}`);
        }
        return response.json();
    };
    useEffect(() => {
        let active = true;
        const loadData = async () => {
            setLoading(true);
            setError(null);
            try {
                const [quoteData, profileData, candlesData, newsData] = await Promise.all([
                    fetchJson(`/api/quote/${symbol}`),
                    fetchJson(`/api/profile/${symbol}`),
                    fetchJson(`/api/candles/${symbol}?resolution=D&days=30`),
                    fetchJson(`/api/news/${symbol}`),
                ]);
                if (!active) {
                    return;
                }
                setQuote(quoteData);
                setProfile(profileData);
                setCandles(normalizeCandles(candlesData));
                setNews(Array.isArray(newsData) ? newsData.slice(0, 5) : []);
            }
            catch {
                if (active) {
                    setQuote(null);
                    setProfile(null);
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
        void loadData();
        return () => {
            active = false;
        };
    }, [symbol]);
    useEffect(() => {
        const id = window.setInterval(() => {
            const refreshQuote = async () => {
                try {
                    const updatedQuote = await fetchJson(`/api/quote/${symbol}`);
                    setQuote(updatedQuote);
                    setError(null);
                }
                catch {
                    setError('Quote refresh failed. Showing last known data.');
                }
            };
            void refreshQuote();
        }, 10000);
        return () => window.clearInterval(id);
    }, [symbol]);
    const watchlistItems = useMemo(() => watchlist.map((item) => {
        if (item.symbol !== symbol || !quote) {
            return item;
        }
        const changeValue = quote.percent_change ?? quote.change ?? 0;
        const changeText = `${changeValue >= 0 ? '+' : ''}${compactFormatter.format(changeValue)}%`;
        return {
            ...item,
            price: currencyFormatter.format(quote.current_price),
            change: changeText,
            positive: changeValue >= 0,
        };
    }), [quote, symbol]);
    const chartValues = candles.length > 0 ? candles.map((entry) => entry.value) : [quote?.current_price ?? 0];
    const chartLabels = candles.length > 0 ? candles.map((entry) => entry.label) : ['Live'];
    return (_jsx("main", { className: "dashboard-page", children: _jsx("div", { className: "dashboard-container", children: _jsxs("div", { className: "dashboard-overlay", children: [_jsxs("header", { className: "product-nav", children: [_jsx(Link, { to: "/", className: "brand", children: "PERSONAL SYSTEMS" }), _jsxs("nav", { children: [_jsx(Link, { to: "/craps", children: "Craps" }), _jsx(Link, { className: "current", to: "/dashboard", children: "Dashboard" })] }), _jsxs("span", { className: "status-badge", children: [_jsx("i", {}), " Market open"] })] }), _jsxs("div", { className: "dashboard-shell", children: [_jsxs("section", { className: "dashboard-topbar", children: [_jsxs("div", { children: [_jsx("p", { className: "eyebrow", children: "MARKET OVERVIEW" }), _jsxs("div", { className: "topbar-symbol-row", children: [_jsx("h1", { children: symbol }), _jsx("span", { children: profile?.name ?? 'Live equity quote' })] })] }), _jsxs("div", { className: "topbar-price", children: [_jsx("span", { className: "topbar-label", children: "LAST PRICE" }), _jsx("strong", { children: quote ? currencyFormatter.format(quote.current_price) : '—' }), _jsx("span", { className: "change-pill", style: { color: topBarColor }, children: quote ? `${isPositive ? '+' : ''}${compactFormatter.format(quoteChange)}%` : '—' })] })] }), _jsxs("section", { className: "dashboard-grid", children: [_jsx(Watchlist, { items: watchlistItems, selected: symbol, onSelect: setSymbol }), _jsxs("article", { className: "dashboard-main-card", children: [_jsxs("div", { className: "panel-heading", children: [_jsxs("div", { children: [_jsx("p", { className: "eyebrow", children: "PRICE ACTION" }), _jsxs("h2", { children: [symbol, " intraday"] })] }), _jsx("span", { className: "muted-text", children: "USD \u2022 NASDAQ" })] }), loading && !quote ? (_jsx("div", { className: "panel-state", children: "Loading latest market data\u2026" })) : error && !quote ? (_jsx("div", { className: "panel-state", children: error })) : (_jsxs(_Fragment, { children: [_jsx("div", { className: "chart-card", children: _jsx(StockChart, { values: chartValues, labels: chartLabels, positive: isPositive }) }), _jsxs("div", { className: "stats-strip", children: [_jsxs("div", { children: [_jsx("span", { className: "muted-text", children: "Open" }), _jsx("strong", { children: quote?.open ? currencyFormatter.format(quote.open) : '—' })] }), _jsxs("div", { children: [_jsx("span", { className: "muted-text", children: "High" }), _jsx("strong", { children: quote?.high ? currencyFormatter.format(quote.high) : '—' })] }), _jsxs("div", { children: [_jsx("span", { className: "muted-text", children: "Low" }), _jsx("strong", { children: quote?.low ? currencyFormatter.format(quote.low) : '—' })] }), _jsxs("div", { children: [_jsx("span", { className: "muted-text", children: "Prev Close" }), _jsx("strong", { children: quote?.previous_close ? currencyFormatter.format(quote.previous_close) : '—' })] })] })] }))] }), _jsxs("aside", { className: "dashboard-news-card", children: [_jsx("div", { className: "panel-heading", children: _jsxs("div", { children: [_jsx("p", { className: "eyebrow", children: "NEWS" }), _jsx("h2", { children: "Latest headlines" })] }) }), _jsx("div", { className: "news-list", children: news.length > 0 ? news.map((article, index) => (_jsxs("a", { href: article.url, target: "_blank", rel: "noreferrer", className: "news-item", children: [_jsx("span", { className: "news-meta", children: article.source ?? 'Market' }), _jsx("strong", { children: article.headline }), _jsx("span", { className: "news-time", children: article.published ?? 'Now' })] }, `${article.headline}-${index}`))) : (_jsxs("div", { className: "panel-state secondary", children: ["No news available for ", symbol, " right now."] })) })] })] }), _jsxs("section", { className: "dashboard-bottom-grid", children: [_jsxs("article", { className: "dashboard-panel", children: [_jsx("div", { className: "panel-heading compact", children: _jsxs("div", { children: [_jsx("p", { className: "eyebrow", children: "METRICS" }), _jsx("h2", { children: "Key metrics" })] }) }), _jsxs("div", { className: "detail-grid", children: [_jsxs("div", { children: [_jsx("span", { className: "muted-text", children: "Market cap" }), _jsx("strong", { children: profile?.market_cap ? currencyFormatter.format(profile.market_cap) : '—' })] }), _jsxs("div", { children: [_jsx("span", { className: "muted-text", children: "Volume" }), _jsx("strong", { children: "\u2014" })] }), _jsxs("div", { children: [_jsx("span", { className: "muted-text", children: "Day range" }), _jsx("strong", { children: quote?.high && quote?.low ? `${currencyFormatter.format(quote.low)} – ${currencyFormatter.format(quote.high)}` : '—' })] })] })] }), _jsxs("article", { className: "dashboard-panel", children: [_jsx("div", { className: "panel-heading compact", children: _jsxs("div", { children: [_jsx("p", { className: "eyebrow", children: "RANGE 52W" }), _jsx("h2", { children: "Price range" })] }) }), _jsxs("div", { className: "detail-grid range-card", children: [_jsxs("div", { children: [_jsx("span", { className: "muted-text", children: "High" }), _jsx("strong", { children: quote?.high ? currencyFormatter.format(quote.high) : '—' })] }), _jsxs("div", { children: [_jsx("span", { className: "muted-text", children: "Low" }), _jsx("strong", { children: quote?.low ? currencyFormatter.format(quote.low) : '—' })] })] })] }), _jsxs("article", { className: "dashboard-panel", children: [_jsx("div", { className: "panel-heading compact", children: _jsxs("div", { children: [_jsx("p", { className: "eyebrow", children: "COMPANY" }), _jsx("h2", { children: "Profile" })] }) }), _jsxs("div", { className: "detail-grid", children: [_jsxs("div", { children: [_jsx("span", { className: "muted-text", children: "Name" }), _jsx("strong", { children: profile?.name ?? symbol })] }), _jsxs("div", { children: [_jsx("span", { className: "muted-text", children: "Industry" }), _jsx("strong", { children: profile?.industry ?? '—' })] }), _jsxs("div", { children: [_jsx("span", { className: "muted-text", children: "Country" }), _jsx("strong", { children: profile?.country ?? '—' })] })] })] })] })] })] }) }) }));
}
export default Dashboard;
