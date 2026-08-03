import { jsx as _jsx } from "react/jsx-runtime";
import { useEffect, useMemo, useState } from 'react';
import { Chart } from 'react-chartjs-2';
import { BarController, BarElement, CategoryScale, Chart as ChartJS, Legend, LinearScale, Tooltip, } from 'chart.js';
import { CandlestickController, CandlestickElement } from 'chartjs-chart-financial';
ChartJS.register(BarController, BarElement, CategoryScale, CandlestickController, CandlestickElement, Legend, LinearScale, Tooltip);
const API = import.meta.env.VITE_API_BASE_URL;
const ranges = {
    '1D': { resolution: 'D', days: 5 }, '1W': { resolution: 'D', days: 7 }, '1M': { resolution: 'D', days: 30 },
    '6M': { resolution: 'D', days: 180 }, '1Y': { resolution: 'D', days: 365 }, '5Y': { resolution: 'W', days: 1825 }, MAX: { resolution: 'M', days: 7300 },
};
function numberAt(source, index) {
    return Array.isArray(source) && typeof source[index] === 'number' ? source[index] : 0;
}
function normalize(payload) {
    const record = payload;
    const timestamps = Array.isArray(record?.t) ? record.t : Array.isArray(record?.timestamps) ? record.timestamps : [];
    const open = Array.isArray(record?.o) ? record.o : record?.open;
    const high = Array.isArray(record?.h) ? record.h : record?.high;
    const low = Array.isArray(record?.l) ? record.l : record?.low;
    const close = Array.isArray(record?.c) ? record.c : record?.close;
    const volume = Array.isArray(record?.v) ? record.v : record?.volume;
    return timestamps.map((raw, index) => {
        const seconds = Number(raw);
        const date = new Date(seconds * (seconds > 1e12 ? 1 : 1000));
        return { x: index, o: numberAt(open, index), h: numberAt(high, index), l: numberAt(low, index), c: numberAt(close, index), v: numberAt(volume, index), label: Number.isNaN(date.valueOf()) ? `${index + 1}` : date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' }) };
    }).filter(({ h, l, c }) => h || l || c);
}
function MainChart({ symbol, timeframe }) {
    const [candles, setCandles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    useEffect(() => {
        let current = true;
        const range = ranges[timeframe];
        setLoading(true);
        setError(null);
        fetch(`${API}/api/candles/${symbol}?resolution=${range.resolution}&days=${range.days}`)
            .then((response) => { if (!response.ok)
            throw new Error(); return response.json(); })
            .then((payload) => { if (current)
            setCandles(normalize(payload)); })
            .catch(() => { if (current) {
            setCandles([]);
            setError('Historical data is temporarily unavailable.');
        } })
            .finally(() => { if (current)
            setLoading(false); });
        return () => { current = false; };
    }, [symbol, timeframe]);
    const data = useMemo(() => ({
        labels: candles.map(({ label }) => label),
        datasets: [
            { type: 'candlestick', label: 'Price', data: candles.map(({ x, o, h, l, c }) => ({ x, o, h, l, c })), yAxisID: 'price', color: { up: '#91a39b', down: '#8a7373', unchanged: '#8b9296' } },
            { type: 'bar', label: 'Volume', data: candles.map(({ x, v }) => ({ x, y: v })), yAxisID: 'volume', backgroundColor: 'rgba(203, 213, 225, .16)', borderWidth: 0, barPercentage: .9, categoryPercentage: 1 },
        ],
    }), [candles]);
    const options = {
        responsive: true,
        maintainAspectRatio: false,
        animation: false,
        parsing: false,
        plugins: { legend: { display: false }, tooltip: { mode: 'index', intersect: false } },
        scales: {
            x: { type: 'category', grid: { color: 'rgba(255,255,255,.045)' }, ticks: { color: '#cbd5e1', maxTicksLimit: 6, maxRotation: 0 } },
            price: { type: 'linear', position: 'right', grid: { color: 'rgba(255,255,255,.07)' }, ticks: { color: '#cbd5e1', maxTicksLimit: 5 } },
            volume: { type: 'linear', position: 'left', display: false, grid: { display: false }, beginAtZero: true },
        },
    };
    if (loading)
        return _jsx("div", { className: "chart-wrap chart-message", children: "Loading historical data\u2026" });
    if (error || !candles.length)
        return _jsx("div", { className: "chart-wrap chart-message", children: error ?? 'No chart data available.' });
    return _jsx("div", { className: "chart-wrap main-chart", children: _jsx(Chart, { type: "bar", data: data, options: options }) });
}
export default MainChart;
