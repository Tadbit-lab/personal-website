import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect, useCallback } from 'react';
import { analyzeStock } from './StockAnalysisDashboard';
import StockChart from './StockChart';
import StockCard from './StockCard';
import NumberStat from './NumberStat';
import NewsList from './newsLinks';
import NewsSentimentDoughnut from './NewsSentimentDoughnut';
import './StockAnalysisDashboard.css';
/* ===========================
   COMPONENT
   =========================== */
function StockDashboard() {
    const [stockData, setStockData] = useState(null);
    const [stockSymbol, setStockSymbol] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [lastUpdated, setLastUpdated] = useState(null);
    /* ===========================
       FETCH
       =========================== */
    const runAnalysis = useCallback(async (symbol) => {
        const target = symbol || stockSymbol;
        if (!target)
            return;
        setLoading(true);
        setError(null);
        try {
            const response = await analyzeStock(target);
            if (!response || !response.data || !response.data.basicInfo) {
                throw new Error('Invalid stock data returned');
            }
            setStockData(response.data);
            setLastUpdated(new Date());
        }
        catch {
            setError('Failed to fetch stock data. The API may be unavailable.');
            setStockData(null);
        }
        finally {
            setLoading(false);
        }
    }, [stockSymbol]);
    /* ===========================
       POLLING (5 second interval, cleanup on unmount)
       =========================== */
    useEffect(() => {
        if (!stockData || !stockSymbol)
            return;
        const interval = setInterval(() => {
            runAnalysis(stockSymbol);
        }, 5000);
        return () => clearInterval(interval);
    }, [stockData, stockSymbol, runAnalysis]);
    /* ===========================
       DERIVED STATE
       =========================== */
    const hasData = stockData !== null &&
        stockData.basicInfo &&
        Object.keys(stockData.basicInfo).length > 0;
    /* ===========================
       RENDER
       =========================== */
    return (_jsx("div", { className: "stock-dashboard", children: hasData ? (
        /* ---- RESULT VIEW ---- */
        _jsxs("div", { className: "container", children: [_jsxs("div", { className: "stock-result-header", children: [_jsxs("div", { children: [_jsx("button", { className: "btn btn-ghost", onClick: () => { setStockData(null); setError(null); }, style: { marginRight: '16px' }, children: "\u2190 Back" }), _jsx("h2", { style: { display: 'inline' }, children: stockSymbol })] }), lastUpdated && (_jsxs("span", { className: "stock-last-updated", children: ["Last updated: ", lastUpdated.toLocaleTimeString()] }))] }), error && (_jsx("div", { className: "alert-error", style: { marginBottom: '16px' }, children: error })), _jsxs("div", { className: "stat-cards-grid", children: [_jsx(NumberStat, { value: stockData.basicInfo?.marketCap ?? 'N/A', label: "Market Cap" }), _jsx(NumberStat, { value: stockData.basicInfo?.fullTimeEmployees ?? 'N/A', label: "Employees" }), _jsx(NumberStat, { value: stockData.basicInfo?.totalRevenue ?? 'N/A', label: "Total Revenue" }), _jsx(NumberStat, { value: stockData.basicInfo?.trailingEps ?? 'N/A', label: "Earnings Per Share" })] }), _jsx("div", { className: "stock-chart-container", children: stockData.priceHistory ? (_jsx(StockChart, { priceHistory: stockData.priceHistory })) : (_jsx("div", { style: { color: 'var(--text-muted)', padding: '20px' }, children: "No price history available" })) }), _jsx(StockCard, {}), _jsxs("div", { className: "stock-content-grid", children: [_jsxs("div", { className: "stock-content-card", children: [_jsx("h3", { children: "Recent News" }), _jsx(NewsList, { newsLinks: stockData.newsArticles ?? [] })] }), _jsxs("div", { className: "stock-content-card", children: [_jsx("h3", { children: "News Sentiment" }), stockData.newsTextAnalysis ? (_jsx(NewsSentimentDoughnut, { stockAnalysisJson: stockData })) : (_jsx("div", { style: { color: 'var(--text-muted)' }, children: "No sentiment data" }))] }), _jsxs("div", { className: "stock-content-card", children: [_jsx("h3", { children: "Future Earnings" }), stockData.futureEarningsDates?.length > 0 ? (stockData.futureEarningsDates.map((date) => (_jsx("div", { className: "earnings-date", children: date }, date)))) : (_jsx("div", { style: { color: 'var(--text-muted)' }, children: "No upcoming earnings" }))] })] })] })) : (
        /* ---- INPUT VIEW ---- */
        _jsxs("div", { className: "stock-input-view", children: [_jsx("h1", { children: "Stock Dashboard" }), _jsx("p", { children: "Enter a stock symbol to analyze (e.g. MSFT, AAPL)" }), error && (_jsx("div", { className: "alert-error", children: error })), loading && (_jsx("div", { className: "stock-spinner-overlay", children: _jsx("div", { className: "stock-spinner" }) })), _jsxs("div", { className: "stock-input-row", children: [_jsx("input", { type: "text", value: stockSymbol, onChange: (e) => setStockSymbol(e.target.value.toUpperCase()), placeholder: "MSFT", disabled: loading, id: "stock-symbol-input", onKeyDown: (e) => { if (e.key === 'Enter')
                                runAnalysis(); } }), _jsx("button", { className: "btn btn-primary", onClick: () => runAnalysis(), disabled: loading || !stockSymbol, id: "analyze-stock-btn", children: loading ? 'Analyzing…' : 'Analyze' })] }), _jsx("div", { style: { width: '100%', maxWidth: '700px', marginTop: '32px' }, children: _jsx(StockCard, {}) })] })) }));
}
export default StockDashboard;
