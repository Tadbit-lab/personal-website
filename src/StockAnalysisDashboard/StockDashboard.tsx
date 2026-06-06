import { useState, useEffect, useCallback } from 'react'
import { analyzeStock } from './StockAnalysisDashboard'
import StockChart from './StockChart'
import StockCard from './StockCard'
import NumberStat from './NumberStat'
import NewsList from './newsLinks'
import NewsSentimentDoughnut from './NewsSentimentDoughnut'
import './StockAnalysisDashboard.css'

/* ===========================
   TYPES
   =========================== */

interface StockDataType {
  basicInfo: Record<string, any>
  priceHistory: any
  futureEarningsDates: string[]
  newsArticles: any[]
  newsTextAnalysis: any
}

/* ===========================
   COMPONENT
   =========================== */

function StockDashboard() {
  const [stockData, setStockData] = useState<StockDataType | null>(null)
  const [stockSymbol, setStockSymbol] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  /* ===========================
     FETCH
     =========================== */

  const runAnalysis = useCallback(async (symbol?: string) => {
    const target = symbol || stockSymbol
    if (!target) return

    setLoading(true)
    setError(null)

    try {
      const response = await analyzeStock(target)

      if (!response || !response.data || !response.data.basicInfo) {
        throw new Error('Invalid stock data returned')
      }

      setStockData(response.data)
      setLastUpdated(new Date())
    } catch {
      setError('Failed to fetch stock data. The API may be unavailable.')
      setStockData(null)
    } finally {
      setLoading(false)
    }
  }, [stockSymbol])

  /* ===========================
     POLLING (5 second interval, cleanup on unmount)
     =========================== */

  useEffect(() => {
    if (!stockData || !stockSymbol) return

    const interval = setInterval(() => {
      runAnalysis(stockSymbol)
    }, 5000)

    return () => clearInterval(interval)
  }, [stockData, stockSymbol, runAnalysis])

  /* ===========================
     DERIVED STATE
     =========================== */

  const hasData =
    stockData !== null &&
    stockData.basicInfo &&
    Object.keys(stockData.basicInfo).length > 0

  /* ===========================
     RENDER
     =========================== */

  return (
    <div className="stock-dashboard">
      {hasData ? (
        /* ---- RESULT VIEW ---- */
        <div className="container">
          {/* Header */}
          <div className="stock-result-header">
            <div>
              <button
                className="btn btn-ghost"
                onClick={() => { setStockData(null); setError(null) }}
                style={{ marginRight: '16px' }}
              >
                ← Back
              </button>
              <h2 style={{ display: 'inline' }}>
                {stockSymbol}
              </h2>
            </div>
            {lastUpdated && (
              <span className="stock-last-updated">
                Last updated: {lastUpdated.toLocaleTimeString()}
              </span>
            )}
          </div>

          {/* Error alert (inline, flat) */}
          {error && (
            <div className="alert-error" style={{ marginBottom: '16px' }}>
              {error}
            </div>
          )}

          {/* Stat Cards */}
          <div className="stat-cards-grid">
            <NumberStat
              value={stockData.basicInfo?.marketCap ?? 'N/A'}
              label="Market Cap"
            />
            <NumberStat
              value={stockData.basicInfo?.fullTimeEmployees ?? 'N/A'}
              label="Employees"
            />
            <NumberStat
              value={stockData.basicInfo?.totalRevenue ?? 'N/A'}
              label="Total Revenue"
            />
            <NumberStat
              value={stockData.basicInfo?.trailingEps ?? 'N/A'}
              label="Earnings Per Share"
            />
          </div>

          {/* Chart */}
          <div className="stock-chart-container">
            {stockData.priceHistory ? (
              <StockChart priceHistory={stockData.priceHistory} />
            ) : (
              <div style={{ color: 'var(--text-muted)', padding: '20px' }}>
                No price history available
              </div>
            )}
          </div>

          {/* Market Overview Table */}
          <StockCard />

          {/* News / Sentiment / Word Cloud */}
          <div className="stock-content-grid">
            <div className="stock-content-card">
              <h3>Recent News</h3>
              <NewsList newsLinks={stockData.newsArticles ?? []} />
            </div>

            <div className="stock-content-card">
              <h3>News Sentiment</h3>
              {stockData.newsTextAnalysis ? (
                <NewsSentimentDoughnut stockAnalysisJson={stockData} />
              ) : (
                <div style={{ color: 'var(--text-muted)' }}>
                  No sentiment data
                </div>
              )}
            </div>

            <div className="stock-content-card">
              <h3>Future Earnings</h3>
              {stockData.futureEarningsDates?.length > 0 ? (
                stockData.futureEarningsDates.map((date: string) => (
                  <div key={date} className="earnings-date">{date}</div>
                ))
              ) : (
                <div style={{ color: 'var(--text-muted)' }}>
                  No upcoming earnings
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* ---- INPUT VIEW ---- */
        <div className="stock-input-view">
          <h1>Stock Dashboard</h1>
          <p>Enter a stock symbol to analyze (e.g. MSFT, AAPL)</p>

          {/* Error alert */}
          {error && (
            <div className="alert-error">
              {error}
            </div>
          )}

          {/* Loading spinner */}
          {loading && (
            <div className="stock-spinner-overlay">
              <div className="stock-spinner" />
            </div>
          )}

          <div className="stock-input-row">
            <input
              type="text"
              value={stockSymbol}
              onChange={(e) => setStockSymbol(e.target.value.toUpperCase())}
              placeholder="MSFT"
              disabled={loading}
              id="stock-symbol-input"
              onKeyDown={(e) => { if (e.key === 'Enter') runAnalysis() }}
            />
            <button
              className="btn btn-primary"
              onClick={() => runAnalysis()}
              disabled={loading || !stockSymbol}
              id="analyze-stock-btn"
            >
              {loading ? 'Analyzing…' : 'Analyze'}
            </button>
          </div>

          {/* Market Overview always visible */}
          <div style={{ width: '100%', maxWidth: '700px', marginTop: '32px' }}>
            <StockCard />
          </div>
        </div>
      )}
    </div>
  )
}

export default StockDashboard
