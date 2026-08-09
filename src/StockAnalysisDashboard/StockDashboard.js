import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect, useCallback, lazy, Suspense } from 'react';
import { analyzeStock } from './StockAnalysisDashboard';
import StockCard from './StockCard';
import NumberStat from './NumberStat';
import NewsList from './newsLinks';
import NewsSentimentDoughnut from './NewsSentimentDoughnut';
import DashboardSidebar from './DashboardSidebar';
import GraphView from './GraphView';
import { clearDefeatbetaCache } from './defeatbetaClient';
import './StockAnalysisDashboard.css';
/* Lazy-load Company Info — not needed on first render */
const CompanyInfoView = lazy(() => import('./CompanyInfoView'));
/* ===========================
   COMPONENT
   =========================== */
function StockDashboard() {
    const [stockData, setStockData] = useState(null);
    const [stockSymbol, setStockSymbol] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [lastUpdated, setLastUpdated] = useState(null);
    const [activeView, setActiveView] = useState('graph');
    /* ===========================
       FETCH (unchanged logic)
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
       POLLING (5 second interval)
       =========================== */
    useEffect(() => {
        if (!stockData || !stockSymbol)
            return;
        const interval = setInterval(() => { runAnalysis(stockSymbol); }, 5000);
        return () => clearInterval(interval);
    }, [stockData, stockSymbol, runAnalysis]);
    /* ===========================
       CLEAR CACHE ON SYMBOL CHANGE
       =========================== */
    const handleBack = useCallback(() => {
        if (stockSymbol)
            clearDefeatbetaCache(stockSymbol);
        setStockData(null);
        setError(null);
        setActiveView('graph');
    }, [stockSymbol]);
    /* ===========================
       DERIVED STATE
       =========================== */
    const hasData = stockData !== null &&
        stockData.basicInfo &&
        Object.keys(stockData.basicInfo).length > 0;
    /* ===========================
       RENDER
       =========================== */
    return (_jsxs("div", { className: "stock-dashboard-wrapper", style: {
            backgroundImage: "url('/crapsgame/images/stock.jpg')",
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            position: 'relative',
            minHeight: '100%',
            flex: 1,
            display: 'flex',
            flexDirection: 'column'
        }, children: [_jsx("div", { className: "stock-overlay", style: {
                    position: 'absolute',
                    inset: 0,
                    backgroundColor: 'rgba(0,0,0,0.7)',
                    zIndex: 0
                } }), _jsx("div", { className: "stock-dashboard", style: { position: 'relative', zIndex: 1, flex: 1 }, children: hasData ? (
                /* ---- RESULT VIEW (dual-pane) ---- */
                _jsxs("div", { className: "container", children: [_jsxs("div", { className: "stock-result-header", children: [_jsxs("div", { children: [_jsx("button", { className: "btn btn-ghost", onClick: handleBack, style: { marginRight: '16px' }, children: "\u2190 Back" }), _jsx("h2", { style: { display: 'inline' }, children: stockSymbol })] }), lastUpdated && (_jsxs("span", { className: "stock-last-updated", children: ["Last updated: ", lastUpdated.toLocaleTimeString()] }))] }), error && (_jsx("div", { className: "alert-error", style: { marginBottom: '16px' }, children: error })), _jsxs("div", { className: "stat-cards-grid", children: [_jsx(NumberStat, { value: stockData.basicInfo?.marketCap ?? 'N/A', label: "Market Cap" }), _jsx(NumberStat, { value: stockData.basicInfo?.fullTimeEmployees ?? 'N/A', label: "Employees" }), _jsx(NumberStat, { value: stockData.basicInfo?.totalRevenue ?? 'N/A', label: "Total Revenue" }), _jsx(NumberStat, { value: stockData.basicInfo?.trailingEps ?? 'N/A', label: "EPS" })] }), _jsxs("div", { className: "dash-layout", children: [_jsx(DashboardSidebar, { activeView: activeView, onViewChange: setActiveView, symbol: stockSymbol }), _jsxs("div", { className: "dash-main", children: [activeView === 'graph' && (_jsx(GraphView, { symbol: stockSymbol, priceHistoryFallback: stockData.priceHistory })), activeView === 'info' && (_jsx(Suspense, { fallback: _jsx("div", { className: "dash-suspense-fallback", children: _jsx("div", { className: "stock-spinner" }) }), children: _jsx(CompanyInfoView, { symbol: stockSymbol, basicInfo: stockData.basicInfo }) }))] })] }), _jsxs("div", { className: "stock-content-grid", style: { marginTop: 'var(--gap-lg)' }, children: [_jsxs("div", { className: "stock-content-card", children: [_jsx("h3", { children: "Recent News" }), _jsx(NewsList, { newsLinks: stockData.newsArticles ?? [] })] }), _jsxs("div", { className: "stock-content-card", children: [_jsx("h3", { children: "News Sentiment" }), stockData.newsTextAnalysis ? (_jsx(NewsSentimentDoughnut, { stockAnalysisJson: stockData })) : (_jsx("div", { style: { color: 'var(--text-muted)' }, children: "No sentiment data" }))] }), _jsxs("div", { className: "stock-content-card", children: [_jsx("h3", { children: "Future Earnings" }), stockData.futureEarningsDates?.length > 0 ? (stockData.futureEarningsDates.map((date) => (_jsx("div", { className: "earnings-date", children: date }, date)))) : (_jsx("div", { style: { color: 'var(--text-muted)' }, children: "No upcoming earnings" }))] })] })] })) : (
                /* ---- INPUT VIEW (unchanged) ---- */
                _jsxs("div", { className: "stock-input-view", children: [_jsx("h1", { children: "Stock Dashboard" }), _jsx("p", { children: "Enter a stock symbol to analyze (e.g. MSFT, AAPL)" }), error && _jsx("div", { className: "alert-error", children: error }), loading && (_jsx("div", { className: "stock-spinner-overlay", children: _jsx("div", { className: "stock-spinner" }) })), _jsxs("div", { className: "stock-input-row", children: [_jsx("input", { type: "text", value: stockSymbol, onChange: (e) => setStockSymbol(e.target.value.toUpperCase()), placeholder: "MSFT", disabled: loading, id: "stock-symbol-input", onKeyDown: (e) => { if (e.key === 'Enter')
                                        runAnalysis(); } }), _jsx("button", { className: "btn btn-primary", onClick: () => runAnalysis(), disabled: loading || !stockSymbol, id: "analyze-stock-btn", children: loading ? 'Analyzing…' : 'Analyze' })] }), _jsx("div", { style: { width: '100%', maxWidth: '700px', marginTop: '32px' }, children: _jsx(StockCard, {}) })] })) })] }));
}
export default StockDashboard;
