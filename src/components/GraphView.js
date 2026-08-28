import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useCallback, useEffect, useMemo, useState } from 'react';
import MainChart from './MainChart';
const API = import.meta.env.VITE_API_BASE_URL;
const GraphView = ({ symbol, timeframe, onTimeframeChange, currentQuote, }) => {
    const allowedTimeframes = ['1M', '6M', '1Y', '5Y', 'MAX'];
    const [historicalTrend, setHistoricalTrend] = useState(null);
    const [technicals, setTechnicals] = useState(null);
    const [techLoading, setTechLoading] = useState(false);
    const currencyFormatter = useMemo(() => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }), []);
    const compactFormatter = useMemo(() => new Intl.NumberFormat('en-US', { notation: 'compact', compactDisplay: 'short' }), []);
    const signFormatter = useMemo(() => new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 }), []);
    const handleTrendCalculated = useCallback((isPositive, pctChange) => {
        setHistoricalTrend({ isPositive, pctChange });
    }, []);
    // Fetch Twelve Data technical indicators
    useEffect(() => {
        let active = true;
        setTechLoading(true);
        fetch(`${API}/api/technicals/${symbol}`)
            .then((res) => (res.ok ? res.json() : null))
            .then((data) => {
            if (active && data && !data.error) {
                setTechnicals(data);
            }
        })
            .catch(() => {
            // Fallback gracefully without breaking UI
        })
            .finally(() => {
            if (active)
                setTechLoading(false);
        });
        return () => {
            active = false;
        };
    }, [symbol]);
    // Inference derived from HISTORICAL chart trend and Twelve Data technicals
    const inference = useMemo(() => {
        const isUp = historicalTrend?.isPositive ?? (currentQuote?.percent_change ?? 0) >= 0;
        const absChange = Math.abs(historicalTrend?.pctChange ?? currentQuote?.percent_change ?? 0);
        let trend = technicals?.signals?.trend || 'Neutral / Consolidation';
        let volatility = 'Moderate Volatility';
        let interpretation = 'Price is consolidating around moving average support. Key volume patterns suggest institutional accumulation.';
        if (absChange > 30) {
            trend = isUp ? 'Strong Bullish Expansion' : 'Strong Bearish Selloff';
            volatility = 'High Volatility';
            interpretation = isUp
                ? 'Substantial cumulative buying pressure over the selected period. Multi-year trajectory points to robust upward momentum driven by strong institutional accumulation.'
                : 'Severe cumulative downward pressure over the selected period. The stock has faced persistent selling. Immediate support levels should be closely monitored.';
        }
        else if (absChange > 10) {
            trend = isUp ? 'Moderate Bullish Trend' : 'Moderate Bearish Trend';
            volatility = 'Moderate Volatility';
            interpretation = isUp
                ? 'Steady upward progression over the selected period. Consistent buying interest signals positive investor sentiment and healthy market reception.'
                : 'Consistent distribution over the selected period. The stock is facing headwinds and mild profit-taking, indicating a sustained consolidation phase.';
        }
        else if (absChange > 3) {
            trend = isUp ? 'Mild Bullish Bias' : 'Mild Bearish Bias';
            volatility = 'Low-to-Moderate Volatility';
            interpretation = isUp
                ? 'Gradual upward drift with controlled momentum. Buyers are absorbing supply at a measured pace.'
                : 'Gradual downward drift with muted momentum. Mild selling pressure without significant capitulation.';
        }
        return { trend, volatility, interpretation };
    }, [historicalTrend, currentQuote, technicals]);
    // 52-Week Range calculation
    const fiftyTwoWeek = technicals?.fifty_two_week || currentQuote?.fifty_two_week;
    const price = currentQuote?.current_price || technicals?.current_price || 0;
    const rangePct = useMemo(() => {
        if (!fiftyTwoWeek || !fiftyTwoWeek.high || !fiftyTwoWeek.low || fiftyTwoWeek.high <= fiftyTwoWeek.low)
            return 50;
        const pct = ((price - fiftyTwoWeek.low) / (fiftyTwoWeek.high - fiftyTwoWeek.low)) * 100;
        return Math.max(0, Math.min(100, Math.round(pct)));
    }, [fiftyTwoWeek, price]);
    return (_jsxs("div", { className: "graph-view-panel", children: [_jsxs("article", { className: "dashboard-main-card", children: [_jsxs("div", { className: "panel-heading", children: [_jsxs("div", { children: [_jsx("p", { className: "eyebrow", children: "PRICE ACTION" }), _jsxs("h2", { style: { display: 'flex', alignItems: 'baseline', gap: '10px' }, children: [symbol, " Historical Chart", historicalTrend && (_jsxs("span", { className: historicalTrend.isPositive ? 'text-green' : 'text-red', style: { fontSize: '14px', fontWeight: 700, letterSpacing: '0.02em' }, children: [historicalTrend.isPositive ? '+' : '', signFormatter.format(historicalTrend.pctChange), "%", _jsxs("span", { style: { fontWeight: 400, opacity: 0.65, fontSize: '12px', marginLeft: '4px' }, children: ["(", timeframe, ")"] })] }))] })] }), _jsx("span", { className: "muted-text", children: "USD \u2022 TWELVE DATA LAYER" })] }), _jsx("div", { className: "chart-card", children: _jsx(MainChart, { symbol: symbol, timeframe: timeframe, onTrendCalculated: handleTrendCalculated }) }), _jsx("div", { className: "timeframe-selector", role: "group", "aria-label": "Chart timeframe", children: allowedTimeframes.map((tf) => (_jsx("button", { type: "button", className: timeframe === tf ? 'active' : '', onClick: () => onTimeframeChange(tf), children: tf }, tf))) }), _jsxs("div", { className: "stats-strip", children: [_jsxs("div", { children: [_jsx("span", { className: "muted-text", children: "Open" }), _jsx("strong", { children: currentQuote?.open ? currencyFormatter.format(currentQuote.open) : '—' })] }), _jsxs("div", { children: [_jsx("span", { className: "muted-text", children: "High" }), _jsx("strong", { children: currentQuote?.high ? currencyFormatter.format(currentQuote.high) : '—' })] }), _jsxs("div", { children: [_jsx("span", { className: "muted-text", children: "Low" }), _jsx("strong", { children: currentQuote?.low ? currencyFormatter.format(currentQuote.low) : '—' })] }), _jsxs("div", { children: [_jsx("span", { className: "muted-text", children: "Prev Close" }), _jsx("strong", { children: currentQuote?.previous_close ? currencyFormatter.format(currentQuote.previous_close) : '—' })] })] })] }), _jsxs("article", { className: "dashboard-panel technicals-panel", children: [_jsxs("div", { className: "panel-heading compact", children: [_jsxs("div", { children: [_jsx("p", { className: "eyebrow", children: "TWELVE DATA METRICS" }), _jsx("h2", { children: "Technical Indicators & Multi-Timeframe Signals" })] }), _jsx("span", { className: "muted-text", children: techLoading ? 'Syncing indicators…' : 'LIVE COMPUTED' })] }), _jsxs("div", { className: "technicals-grid", children: [_jsxs("div", { className: "technical-card", children: [_jsx("span", { className: "card-label", children: "RSI (14)" }), _jsx("div", { className: "card-value", children: technicals?.rsi_14 != null ? technicals.rsi_14.toFixed(1) : '—' }), _jsx("div", { className: "card-subtext", children: _jsx("span", { className: `badge-pill ${technicals?.rsi_status === 'Overbought'
                                                ? 'badge-bearish'
                                                : technicals?.rsi_status === 'Oversold'
                                                    ? 'badge-bullish'
                                                    : 'badge-neutral'}`, children: technicals?.rsi_status || 'Neutral' }) })] }), _jsxs("div", { className: "technical-card", children: [_jsx("span", { className: "card-label", children: "MACD (12, 26, 9)" }), _jsx("div", { className: "card-value", children: technicals?.macd?.histogram != null ? (_jsxs("span", { className: technicals.macd.histogram >= 0 ? 'text-green' : 'text-red', children: [technicals.macd.histogram >= 0 ? '+' : '', technicals.macd.histogram.toFixed(2)] })) : ('—') }), _jsx("div", { className: "card-subtext", children: _jsx("span", { className: `badge-pill ${technicals?.macd?.status?.includes('Bullish') ? 'badge-bullish' : 'badge-neutral'}`, children: technicals?.macd?.status || 'Neutral' }) })] }), _jsxs("div", { className: "technical-card", children: [_jsx("span", { className: "card-label", children: "Moving Averages" }), _jsxs("div", { className: "card-value", style: { fontSize: '15px' }, children: ["SMA50: ", technicals?.moving_averages?.sma_50 ? currencyFormatter.format(technicals.moving_averages.sma_50) : '—'] }), _jsxs("div", { className: "card-subtext", children: ["SMA200: ", technicals?.moving_averages?.sma_200 ? currencyFormatter.format(technicals.moving_averages.sma_200) : '—'] })] }), _jsxs("div", { className: "technical-card", children: [_jsx("span", { className: "card-label", children: "52-Week Range" }), _jsx("div", { className: "range-meter-track", children: _jsx("div", { className: "range-meter-fill", style: { width: `${rangePct}%` } }) }), _jsxs("div", { className: "card-subtext", style: { justifyContent: 'space-between' }, children: [_jsx("span", { children: fiftyTwoWeek?.low ? currencyFormatter.format(fiftyTwoWeek.low) : '—' }), _jsxs("strong", { style: { color: '#e2e8f0' }, children: [rangePct, "%"] }), _jsx("span", { children: fiftyTwoWeek?.high ? currencyFormatter.format(fiftyTwoWeek.high) : '—' })] })] }), _jsxs("div", { className: "technical-card", children: [_jsx("span", { className: "card-label", children: "Volume Analysis" }), _jsx("div", { className: "card-value", style: { fontSize: '15px' }, children: technicals?.volume ? compactFormatter.format(technicals.volume) : '—' }), _jsxs("div", { className: "card-subtext", children: ["Avg: ", technicals?.average_volume ? compactFormatter.format(technicals.average_volume) : '—', technicals?.volume_ratio != null && (_jsxs("span", { className: "badge-pill badge-neutral", style: { marginLeft: 'auto' }, children: [technicals.volume_ratio, "x avg"] }))] })] })] }), _jsxs("div", { style: { marginTop: '4px' }, children: [_jsx("span", { className: "card-label", style: { display: 'block', marginBottom: '4px' }, children: "Historical Performance" }), _jsxs("table", { className: "returns-table", children: [_jsx("thead", { children: _jsxs("tr", { children: [_jsx("th", { children: "1 Month" }), _jsx("th", { children: "3 Months" }), _jsx("th", { children: "6 Months" }), _jsx("th", { children: "1 Year" }), _jsx("th", { children: "Golden Cross" })] }) }), _jsx("tbody", { children: _jsxs("tr", { children: [_jsx("td", { className: (technicals?.returns?.return_1m ?? 0) >= 0 ? 'text-green' : 'text-red', children: technicals?.returns?.return_1m != null
                                                        ? `${technicals.returns.return_1m >= 0 ? '+' : ''}${technicals.returns.return_1m}%`
                                                        : '—' }), _jsx("td", { className: (technicals?.returns?.return_3m ?? 0) >= 0 ? 'text-green' : 'text-red', children: technicals?.returns?.return_3m != null
                                                        ? `${technicals.returns.return_3m >= 0 ? '+' : ''}${technicals.returns.return_3m}%`
                                                        : '—' }), _jsx("td", { className: (technicals?.returns?.return_6m ?? 0) >= 0 ? 'text-green' : 'text-red', children: technicals?.returns?.return_6m != null
                                                        ? `${technicals.returns.return_6m >= 0 ? '+' : ''}${technicals.returns.return_6m}%`
                                                        : '—' }), _jsx("td", { className: (technicals?.returns?.return_1y ?? 0) >= 0 ? 'text-green' : 'text-red', children: technicals?.returns?.return_1y != null
                                                        ? `${technicals.returns.return_1y >= 0 ? '+' : ''}${technicals.returns.return_1y}%`
                                                        : '—' }), _jsx("td", { children: _jsx("span", { className: `badge-pill ${technicals?.signals?.golden_cross ? 'badge-bullish' : 'badge-neutral'}`, children: technicals?.signals?.golden_cross ? 'Active (Bullish)' : 'None' }) })] }) })] })] })] }), _jsxs("article", { className: "dashboard-panel inference-panel", children: [_jsx("div", { className: "panel-heading compact", children: _jsxs("div", { children: [_jsx("p", { className: "eyebrow", children: "ANALYTICS" }), _jsx("h2", { children: "Inference Engine" })] }) }), _jsxs("div", { className: "inference-content", children: [_jsxs("div", { className: "inference-grid", children: [_jsxs("div", { className: "inference-item", children: [_jsx("span", { className: "muted-text", children: "Historical Trend" }), _jsx("strong", { className: inference.trend.includes('Bullish') || inference.trend.includes('Mild Bullish')
                                                    ? 'text-green'
                                                    : inference.trend.includes('Bearish') || inference.trend.includes('Mild Bearish')
                                                        ? 'text-red'
                                                        : '', children: historicalTrend ? inference.trend : 'Loading chart…' })] }), _jsxs("div", { className: "inference-item", children: [_jsx("span", { className: "muted-text", children: "Period Return" }), _jsx("strong", { className: historicalTrend?.isPositive ? 'text-green' : historicalTrend ? 'text-red' : '', children: historicalTrend
                                                    ? `${historicalTrend.isPositive ? '+' : ''}${signFormatter.format(historicalTrend.pctChange)}%`
                                                    : '—' })] }), _jsxs("div", { className: "inference-item", children: [_jsx("span", { className: "muted-text", children: "Volatility Note" }), _jsx("strong", { children: inference.volatility })] }), _jsxs("div", { className: "inference-item", children: [_jsx("span", { className: "muted-text", children: "Daily Change" }), _jsx("strong", { className: (currentQuote?.percent_change ?? 0) >= 0 ? 'text-green' : 'text-red', children: currentQuote?.percent_change != null
                                                    ? `${currentQuote.percent_change >= 0 ? '+' : ''}${signFormatter.format(currentQuote.percent_change)}%`
                                                    : '—' })] })] }), _jsxs("div", { className: "inference-description", children: [_jsx("span", { className: "muted-text", children: "Multi-Period Interpretation" }), _jsx("p", { children: historicalTrend ? inference.interpretation : 'Waiting for historical data to compute trend analysis.' })] })] })] })] }));
};
export default GraphView;
