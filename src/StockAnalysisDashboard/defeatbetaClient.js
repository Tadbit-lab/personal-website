/* ===========================
   defeatbeta API CLIENT
   Typed wrappers for all new backend endpoints.
   In-memory cache keyed by `endpoint:symbol` — avoids duplicate
   fetches within a single dashboard session.
   =========================== */
const API_BASE = import.meta.env.VITE_API_BASE_URL ?? 'https://text-analysis-tool-a0kx.onrender.com';
/* ---- In-memory cache ---- */
const _cache = new Map();
async function fetchEndpoint(path) {
    const cached = _cache.get(path);
    if (cached !== undefined)
        return cached;
    const res = await fetch(`${API_BASE}${path}`);
    if (!res.ok)
        throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    _cache.set(path, json);
    return json;
}
/** Clear all cached responses for a symbol (e.g. after symbol change). */
export function clearDefeatbetaCache(symbol) {
    for (const key of _cache.keys()) {
        if (key.includes(`/${symbol.toUpperCase()}`))
            _cache.delete(key);
    }
}
export function timeframeToDays(tf) {
    switch (tf) {
        case '1M': return 30;
        case '6M': return 180;
        case '1Y': return 365;
        case '5Y': return 1825;
        case 'MAX': return 7300; // ~20 years
    }
}
/* ===========================
   ENDPOINT FUNCTIONS
   =========================== */
/** Historical OHLCV candles — powered by Alpha Vantage via backend. */
export async function fetchCandles(symbol, tf) {
    const days = timeframeToDays(tf);
    return fetchEndpoint(`/api/candles/${encodeURIComponent(symbol.toUpperCase())}?resolution=D&days=${days}`);
}
/** Fundamental metrics — powered by defeatbeta. */
export async function fetchFundamentals(symbol) {
    return fetchEndpoint(`/api/fundamentals/${encodeURIComponent(symbol.toUpperCase())}`);
}
/** Annual income statement history — powered by defeatbeta. */
export async function fetchIncome(symbol) {
    return fetchEndpoint(`/api/income/${encodeURIComponent(symbol.toUpperCase())}`);
}
/** Valuation multiples — powered by defeatbeta. */
export async function fetchValuation(symbol) {
    return fetchEndpoint(`/api/valuation/${encodeURIComponent(symbol.toUpperCase())}`);
}
