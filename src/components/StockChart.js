import { jsx as _jsx } from "react/jsx-runtime";
import { useEffect, useMemo, useState } from 'react';
import { Chart } from 'react-chartjs-2';
import { Chart as ChartJS, TimeScale, LinearScale, Tooltip, Legend } from 'chart.js';
import { CandlestickController, CandlestickElement } from 'chartjs-chart-financial';
import 'chartjs-adapter-date-fns';
ChartJS.register(TimeScale, LinearScale, Tooltip, Legend, CandlestickController, CandlestickElement);
const API = import.meta.env.VITE_API_BASE_URL;
function normalizeCandles(payload) {
    if (!payload) {
        return [];
    }
    const timestamps = Array.isArray(payload.timestamps) ? payload.timestamps : [];
    const opens = Array.isArray(payload.open) ? payload.open : [];
    const highs = Array.isArray(payload.high) ? payload.high : [];
    const lows = Array.isArray(payload.low) ? payload.low : [];
    const closes = Array.isArray(payload.close) ? payload.close : [];
    if (!timestamps.length || !opens.length || !highs.length || !lows.length || !closes.length) {
        return [];
    }
    return timestamps.map((timestamp, index) => {
        const rawTime = typeof timestamp === 'number' ? timestamp : Number(timestamp);
        const x = Number.isFinite(rawTime)
            ? rawTime * (rawTime > 1_000_000_000_000 ? 1 : 1000)
            : Date.now();
        return {
            x,
            o: typeof opens[index] === 'number' ? opens[index] : 0,
            h: typeof highs[index] === 'number' ? highs[index] : 0,
            l: typeof lows[index] === 'number' ? lows[index] : 0,
            c: typeof closes[index] === 'number' ? closes[index] : 0,
        };
    });
}
function StockChart({ values, labels, symbol, timeframe, loading: propLoading = false, error: propError = null }) {
    const [candles, setCandles] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const transformedFallbackData = useMemo(() => {
        if (!values.length) {
            return [];
        }
        return values.map((value, index) => {
            const previous = values[index - 1] ?? value;
            const open = previous;
            const close = value;
            const spread = Math.max(Math.abs(close - open), 1);
            const high = Math.max(open, close) + spread * 0.12;
            const low = Math.min(open, close) - spread * 0.12;
            const parsedLabel = labels[index];
            const parsedTime = parsedLabel ? Date.parse(parsedLabel) : Number.NaN;
            const x = Number.isFinite(parsedTime)
                ? parsedTime
                : Date.now() - (values.length - index - 1) * 24 * 60 * 60 * 1000;
            return { x, o: open, h: high, l: low, c: close };
        });
    }, [labels, values]);
    useEffect(() => {
        let active = true;
        const loadCandles = async () => {
            if (!symbol) {
                setCandles([]);
                setError(null);
                setIsLoading(false);
                return;
            }
            setIsLoading(true);
            setError(null);
            try {
                const resolution = timeframe === '1D' ? 'D' : timeframe === '1W' ? 'D' : timeframe === '1M' ? 'D' : timeframe === '6M' ? 'D' : 'D';
                const response = await fetch(`${API}/api/candles/${symbol}?resolution=${resolution}&days=30`);
                if (!response.ok) {
                    throw new Error('Unable to load candles');
                }
                const payload = (await response.json());
                if (!active) {
                    return;
                }
                const normalized = normalizeCandles(payload);
                setCandles(normalized);
            }
            catch {
                if (active) {
                    setCandles([]);
                    setError('Unable to load candles');
                }
            }
            finally {
                if (active) {
                    setIsLoading(false);
                }
            }
        };
        void loadCandles();
        return () => {
            active = false;
        };
    }, [symbol, timeframe]);
    const resolvedCandles = candles.length > 0 ? candles : transformedFallbackData;
    const resolvedSymbol = symbol ?? 'Symbol';
    const data = useMemo(() => ({
        datasets: [{
                label: resolvedSymbol,
                data: resolvedCandles,
                borderColor: {
                    up: '#22c55e',
                    down: '#ef4444',
                    unchanged: '#9ca3af',
                },
                backgroundColor: {
                    up: '#22c55e',
                    down: '#ef4444',
                    unchanged: '#9ca3af',
                },
                color: {
                    up: '#22c55e',
                    down: '#ef4444',
                    unchanged: '#9ca3af',
                },
            }],
    }), [resolvedCandles, resolvedSymbol]);
    const options = useMemo(() => ({
        responsive: true,
        maintainAspectRatio: false,
        animation: { duration: 0 },
        interaction: {
            mode: 'index',
            intersect: false,
        },
        scales: {
            x: {
                type: 'time',
                time: {
                    unit: 'day',
                },
                grid: {
                    color: 'rgba(255,255,255,0.05)',
                },
                ticks: {
                    color: '#9ca3af',
                    maxRotation: 0,
                },
            },
            y: {
                grid: {
                    color: 'rgba(255,255,255,0.05)',
                },
                ticks: {
                    color: '#9ca3af',
                },
            },
        },
        plugins: {
            legend: {
                display: false,
            },
            tooltip: {
                backgroundColor: '#111827',
                borderColor: 'rgba(255,255,255,0.1)',
                borderWidth: 1,
                titleColor: '#ffffff',
                bodyColor: '#d1d5db',
                callbacks: {
                    label: (context) => {
                        const raw = context.raw;
                        return [
                            `Open: ${raw.o.toFixed(2)}`,
                            `High: ${raw.h.toFixed(2)}`,
                            `Low: ${raw.l.toFixed(2)}`,
                            `Close: ${raw.c.toFixed(2)}`,
                        ];
                    },
                },
            },
        },
    }), []);
    if (propLoading || isLoading) {
        return (_jsx("div", { className: "chart-wrap", style: { height: '100%', display: 'grid', placeItems: 'center', color: '#9ca3af' }, children: "Loading chart\u2026" }));
    }
    if (propError || error) {
        return (_jsx("div", { className: "chart-wrap", style: { height: '100%', display: 'grid', placeItems: 'center', color: '#ef4444' }, children: propError ?? error }));
    }
    if (!resolvedCandles.length) {
        return (_jsx("div", { className: "chart-wrap", style: { height: '100%', display: 'grid', placeItems: 'center', color: '#9ca3af' }, children: "No data available" }));
    }
    return (_jsx("div", { className: "chart-wrap", style: { height: '100%', background: '#0b1220', padding: '12px', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px' }, children: _jsx(Chart, { type: "candlestick", data: data, options: options }) }));
}
export default StockChart;
