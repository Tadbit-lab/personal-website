import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect, useRef, useCallback } from 'react';
import { PrimaryColor } from './StockAnalysisDashboard';
import { fetchCandles, } from './defeatbetaClient';
/* ===========================
   CHART DRAW — OHLCV CANDLESTICK
   =========================== */
function drawCandleChart(canvas, candles, accentColor) {
    const ctx = canvas.getContext('2d');
    if (!ctx || !candles.c.length)
        return;
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);
    const W = rect.width;
    const H = rect.height;
    const VOLUME_H = Math.floor(H * 0.18);
    const CHART_H = H - VOLUME_H - 48; // 48 = x-axis label space + gap
    const PAD = { top: 12, right: 12, bottom: 28, left: 60 };
    const chartW = W - PAD.left - PAD.right;
    const n = candles.c.length;
    ctx.clearRect(0, 0, W, H);
    // ---- Price range ----
    const allHigh = Math.max(...candles.h);
    const allLow = Math.min(...candles.l);
    const priceRange = allHigh - allLow || 1;
    const padPct = 0.06;
    const pMin = allLow - priceRange * padPct;
    const pMax = allHigh + priceRange * padPct;
    const pRange = pMax - pMin;
    const toX = (i) => PAD.left + (i / Math.max(n - 1, 1)) * chartW;
    const toY = (p) => PAD.top + CHART_H - ((p - pMin) / pRange) * CHART_H;
    const candleW = Math.max(2, Math.min(12, chartW / n * 0.7));
    // ---- Y grid ----
    const gridCount = 5;
    ctx.font = `10px 'DM Mono', monospace`;
    ctx.textAlign = 'right';
    for (let i = 0; i <= gridCount; i++) {
        const p = pMin + (pRange / gridCount) * i;
        const y = toY(p);
        ctx.strokeStyle = 'rgba(255,255,255,0.04)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(PAD.left, y);
        ctx.lineTo(W - PAD.right, y);
        ctx.stroke();
        ctx.fillStyle = 'rgba(255,255,255,0.28)';
        ctx.fillText(`$${p.toFixed(0)}`, PAD.left - 6, y + 3.5);
    }
    // ---- X labels (every ~8 candles) ----
    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(255,255,255,0.28)';
    const labelStep = Math.max(1, Math.floor(n / 8));
    for (let i = 0; i < n; i += labelStep) {
        const label = candles.t[i]?.slice(0, 10) ?? '';
        ctx.fillText(label, toX(i), PAD.top + CHART_H + 16);
    }
    // ---- Volume bars ----
    const maxVol = Math.max(...candles.v) || 1;
    for (let i = 0; i < n; i++) {
        const x = toX(i);
        const up = candles.c[i] >= candles.o[i];
        const vh = (candles.v[i] / maxVol) * VOLUME_H;
        const vy = H - VOLUME_H - PAD.bottom + (VOLUME_H - vh);
        ctx.fillStyle = up
            ? 'rgba(99,214,173,0.35)'
            : 'rgba(231,118,118,0.35)';
        ctx.fillRect(x - candleW / 2, vy, candleW, vh);
    }
    // ---- Candlesticks ----
    for (let i = 0; i < n; i++) {
        const x = toX(i);
        const open = toY(candles.o[i]);
        const close = toY(candles.c[i]);
        const high = toY(candles.h[i]);
        const low = toY(candles.l[i]);
        const up = candles.c[i] >= candles.o[i];
        const bodyTop = Math.min(open, close);
        const bodyBottom = Math.max(open, close);
        const bodyH = Math.max(1, bodyBottom - bodyTop);
        const fillColor = up ? '#63d6ad' : '#e77676';
        const strokeColor = up ? '#4abf94' : '#cc5f5f';
        // Wick
        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(x, high);
        ctx.lineTo(x, low);
        ctx.stroke();
        // Body
        ctx.fillStyle = fillColor;
        ctx.fillRect(x - candleW / 2, bodyTop, candleW, bodyH);
    }
    // ---- Accent line (last close trajectory) ----
    if (n > 1) {
        const grad = ctx.createLinearGradient(PAD.left, 0, W - PAD.right, 0);
        grad.addColorStop(0, `${accentColor}00`);
        grad.addColorStop(1, `${accentColor}66`);
        ctx.strokeStyle = grad;
        ctx.lineWidth = 1.5;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        for (let i = 0; i < n; i++) {
            const x = toX(i);
            const y = toY(candles.c[i]);
            if (i === 0)
                ctx.moveTo(x, y);
            else
                ctx.lineTo(x, y);
        }
        ctx.stroke();
        ctx.setLineDash([]);
    }
}
/* Fallback: draw plain line chart from legacy priceHistory */
function drawLineChart(canvas, dates, prices, accentColor) {
    const ctx = canvas.getContext('2d');
    if (!ctx || !prices.length)
        return;
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);
    const W = rect.width;
    const H = rect.height;
    const PAD = { top: 8, right: 8, bottom: 28, left: 56 };
    const cW = W - PAD.left - PAD.right;
    const cH = H - PAD.top - PAD.bottom;
    ctx.clearRect(0, 0, W, H);
    const minP = Math.min(...prices);
    const maxP = Math.max(...prices);
    const range = maxP - minP || 1;
    const pMin = minP - range * 0.05;
    const pMax = maxP + range * 0.05;
    const pRange = pMax - pMin;
    const toX = (i) => PAD.left + (i / (prices.length - 1 || 1)) * cW;
    const toY = (p) => PAD.top + cH - ((p - pMin) / pRange) * cH;
    ctx.font = '10px DM Mono, monospace';
    ctx.textAlign = 'right';
    ctx.fillStyle = 'rgba(255,255,255,0.28)';
    for (let i = 0; i <= 4; i++) {
        const p = pMin + (pRange / 4) * i;
        const y = toY(p);
        ctx.strokeStyle = 'rgba(255,255,255,0.04)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(PAD.left, y);
        ctx.lineTo(W - PAD.right, y);
        ctx.stroke();
        ctx.fillText(`$${p.toFixed(0)}`, PAD.left - 4, y + 3);
    }
    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(255,255,255,0.28)';
    const step = Math.max(1, Math.floor(prices.length / 8));
    for (let i = 0; i < prices.length; i += step)
        ctx.fillText(dates[i] ?? '', toX(i), H - 6);
    ctx.strokeStyle = accentColor;
    ctx.lineWidth = 2;
    ctx.lineJoin = 'round';
    ctx.beginPath();
    prices.forEach((p, i) => { if (i === 0)
        ctx.moveTo(toX(i), toY(p));
    else
        ctx.lineTo(toX(i), toY(p)); });
    ctx.stroke();
}
/* ===========================
   INFERENCE HELPERS
   =========================== */
function deriveInference(candles) {
    if (!candles || candles.c.length < 5) {
        return { trend: 'Insufficient data', volatility: '—', note: '—' };
    }
    const prices = candles.c;
    const n = prices.length;
    const first = prices[0];
    const last = prices[n - 1];
    const pctChange = ((last - first) / first) * 100;
    // Trend
    const trend = pctChange > 10 ? `▲ Strong uptrend (+${pctChange.toFixed(1)}%)` :
        pctChange > 2 ? `▲ Mild uptrend (+${pctChange.toFixed(1)}%)` :
            pctChange < -10 ? `▼ Strong downtrend (${pctChange.toFixed(1)}%)` :
                pctChange < -2 ? `▼ Mild downtrend (${pctChange.toFixed(1)}%)` :
                    `→ Sideways / ranging (${pctChange.toFixed(1)}%)`;
    // Volatility (average daily range / price)
    const avgRange = candles.h.reduce((s, h, i) => s + (h - candles.l[i]), 0) / n;
    const avgRangePct = (avgRange / last) * 100;
    const volatility = avgRangePct > 4 ? `High (avg daily range ${avgRangePct.toFixed(1)}%)` :
        avgRangePct > 1.5 ? `Moderate (avg daily range ${avgRangePct.toFixed(1)}%)` :
            `Low (avg daily range ${avgRangePct.toFixed(1)}%)`;
    const note = pctChange > 0 && avgRangePct < 2
        ? 'Steady, low-volatility uptrend — typically a sign of institutional accumulation.'
        : pctChange > 0 && avgRangePct >= 4
            ? 'Strong gains accompanied by high volatility — momentum driven; watch for reversal signals.'
            : pctChange < 0
                ? 'Downward pressure present. Monitor support levels and earnings catalysts.'
                : 'Price is consolidating. Breakout direction may depend on upcoming macro or earnings news.';
    return { trend, volatility, note };
}
/* ===========================
   COMPONENT
   =========================== */
const TIMEFRAMES = ['1M', '6M', '1Y', '5Y', 'MAX'];
function GraphView({ symbol, priceHistoryFallback }) {
    const [tf, setTf] = useState('1Y');
    const [candles, setCandles] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const canvasRef = useRef(null);
    const containerRef = useRef(null);
    /* ---- Fetch candles on symbol/tf change ---- */
    useEffect(() => {
        let cancelled = false;
        setLoading(true);
        setError(false);
        fetchCandles(symbol, tf)
            .then((data) => {
            if (!cancelled) {
                setCandles(data);
                setLoading(false);
            }
        })
            .catch(() => {
            if (!cancelled) {
                setCandles(null);
                setLoading(false);
                setError(true);
            }
        });
        return () => { cancelled = true; };
    }, [symbol, tf]);
    /* ---- Draw chart ---- */
    const redraw = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas)
            return;
        if (candles && candles.c.length > 0) {
            drawCandleChart(canvas, candles, PrimaryColor);
        }
        else if (error && priceHistoryFallback) {
            drawLineChart(canvas, priceHistoryFallback.date, priceHistoryFallback.price, PrimaryColor);
        }
    }, [candles, error, priceHistoryFallback]);
    useEffect(() => { if (!loading)
        redraw(); }, [loading, redraw]);
    useEffect(() => {
        const el = containerRef.current;
        if (!el)
            return;
        const ro = new ResizeObserver(() => { if (!loading)
            redraw(); });
        ro.observe(el);
        return () => ro.disconnect();
    }, [loading, redraw]);
    /* ---- Stats ---- */
    const latestOpen = candles?.o?.at(-1);
    const latestHigh = candles?.h?.at(-1);
    const latestLow = candles?.l?.at(-1);
    const latestClose = candles?.c?.at(-1);
    const stats = [
        { label: 'Open', value: latestOpen != null ? `$${latestOpen.toFixed(2)}` : '—' },
        { label: 'High', value: latestHigh != null ? `$${latestHigh.toFixed(2)}` : '—' },
        { label: 'Low', value: latestLow != null ? `$${latestLow.toFixed(2)}` : '—' },
        { label: 'Close', value: latestClose != null ? `$${latestClose.toFixed(2)}` : '—' },
    ];
    const inference = deriveInference(candles);
    return (_jsxs("div", { className: "graph-view", children: [_jsx("div", { className: "timeframe-bar", children: TIMEFRAMES.map((t) => (_jsx("button", { id: `tf-btn-${t}`, className: `timeframe-btn${tf === t ? ' active' : ''}`, onClick: () => setTf(t), children: t }, t))) }), _jsxs("div", { className: "stock-chart-container graph-chart-container", ref: containerRef, children: [loading && (_jsx("div", { className: "chart-loading-overlay", children: _jsx("div", { className: "stock-spinner" }) })), _jsx("canvas", { ref: canvasRef, style: { width: '100%', height: '100%', display: 'block', opacity: loading ? 0 : 1, transition: 'opacity 0.3s' } }), !loading && !candles?.c.length && !priceHistoryFallback && (_jsx("div", { style: { color: 'var(--text-muted)', padding: '20px', position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }, children: "No price data available for this timeframe" }))] }), _jsx("div", { className: "graph-stats-row", children: stats.map((s) => (_jsxs("div", { className: "graph-stat", children: [_jsx("span", { className: "graph-stat-label", children: s.label }), _jsx("span", { className: "graph-stat-value", children: s.value })] }, s.label))) }), _jsxs("div", { className: "inference-block", children: [_jsx("h4", { className: "inference-title", children: "Price Analysis" }), _jsxs("div", { className: "inference-row", children: [_jsx("span", { className: "inference-key", children: "Trend" }), _jsx("span", { className: "inference-val", children: inference.trend })] }), _jsxs("div", { className: "inference-row", children: [_jsx("span", { className: "inference-key", children: "Volatility" }), _jsx("span", { className: "inference-val", children: inference.volatility })] }), _jsx("p", { className: "inference-note", children: inference.note })] })] }));
}
export default GraphView;
