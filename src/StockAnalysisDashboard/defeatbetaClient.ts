/* ===========================
   defeatbeta API CLIENT
   Typed wrappers for all new backend endpoints.
   In-memory cache keyed by `endpoint:symbol` — avoids duplicate
   fetches within a single dashboard session.
   =========================== */

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? 'https://text-analysis-tool-a0kx.onrender.com'

/* ---- In-memory cache ---- */
const _cache = new Map<string, unknown>()

async function fetchEndpoint<T>(path: string): Promise<T> {
  const cached = _cache.get(path)
  if (cached !== undefined) return cached as T

  const res = await fetch(`${API_BASE}${path}`)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const json = await res.json() as T
  _cache.set(path, json)
  return json
}

/** Clear all cached responses for a symbol (e.g. after symbol change). */
export function clearDefeatbetaCache(symbol: string) {
  for (const key of _cache.keys()) {
    if (key.includes(`/${symbol.toUpperCase()}`)) _cache.delete(key)
  }
}

/* ===========================
   TYPES
   =========================== */

export interface CandleData {
  /** ISO date strings */
  t: string[]
  o: number[]
  h: number[]
  l: number[]
  c: number[]
  v: number[]
}

export interface FundamentalsData {
  name?: string
  sector?: string
  industry?: string
  pe_ratio?: number | null
  eps?: number | null
  eps_growth_yoy?: number | null
  profit_margin?: number | null
  roe?: number | null
  revenue?: number | null
  revenue_growth_yoy?: number | null
  [key: string]: unknown
}

export interface IncomeData {
  /** Each entry is one fiscal year */
  years: string[]
  revenue: number[]
  gross_profit: number[]
  net_income: number[]
  ebitda: number[]
  [key: string]: unknown
}

export interface ValuationData {
  pe?: number | null
  pb?: number | null
  ps?: number | null
  ev_ebitda?: number | null
  peg?: number | null
  enterprise_value?: number | null
  [key: string]: unknown
}

/* ===========================
   TIMEFRAME HELPERS
   =========================== */

export type Timeframe = '1M' | '6M' | '1Y' | '5Y' | 'MAX'

export function timeframeToDays(tf: Timeframe): number {
  switch (tf) {
    case '1M':  return 30
    case '6M':  return 180
    case '1Y':  return 365
    case '5Y':  return 1825
    case 'MAX': return 7300 // ~20 years
  }
}

/* ===========================
   ENDPOINT FUNCTIONS
   =========================== */

/** Historical OHLCV candles — powered by Alpha Vantage via backend. */
export async function fetchCandles(symbol: string, tf: Timeframe): Promise<CandleData> {
  const days = timeframeToDays(tf)
  return fetchEndpoint<CandleData>(
    `/api/candles/${encodeURIComponent(symbol.toUpperCase())}?resolution=D&days=${days}`
  )
}

/** Fundamental metrics — powered by defeatbeta. */
export async function fetchFundamentals(symbol: string): Promise<FundamentalsData> {
  return fetchEndpoint<FundamentalsData>(
    `/api/fundamentals/${encodeURIComponent(symbol.toUpperCase())}`
  )
}

/** Annual income statement history — powered by defeatbeta. */
export async function fetchIncome(symbol: string): Promise<IncomeData> {
  return fetchEndpoint<IncomeData>(
    `/api/income/${encodeURIComponent(symbol.toUpperCase())}`
  )
}

/** Valuation multiples — powered by defeatbeta. */
export async function fetchValuation(symbol: string): Promise<ValuationData> {
  return fetchEndpoint<ValuationData>(
    `/api/valuation/${encodeURIComponent(symbol.toUpperCase())}`
  )
}
