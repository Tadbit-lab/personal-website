import { useState, useEffect, useCallback, lazy, Suspense } from 'react'
import { analyzeStock } from './StockAnalysisDashboard'
import StockCard from './StockCard'
import NumberStat from './NumberStat'
import NewsList from './newsLinks'
import NewsSentimentDoughnut from './NewsSentimentDoughnut'
import DashboardSidebar, { type DashView } from './DashboardSidebar'
import GraphView from './GraphView'
import { clearDefeatbetaCache } from './defeatbetaClient'
import './StockAnalysisDashboard.css'

/* Lazy-load Company Info — not needed on first render */
const CompanyInfoView = lazy(() => import('./CompanyInfoView'))

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
  const [activeView, setActiveView] = useState<DashView>('graph')

  /* ===========================
     FETCH (unchanged logic)
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
     POLLING (5 second interval)
     =========================== */

  useEffect(() => {
    if (!stockData || !stockSymbol) return
    const interval = setInterval(() => { runAnalysis(stockSymbol) }, 5000)
    return () => clearInterval(interval)
  }, [stockData, stockSymbol, runAnalysis])

  /* ===========================
     CLEAR CACHE ON SYMBOL CHANGE
     =========================== */

  const handleBack = useCallback(() => {
    if (stockSymbol) clearDefeatbetaCache(stockSymbol)
    setStockData(null)
    setError(null)
    setActiveView('graph')
  }, [stockSymbol])

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
    <div className="stock-dashboard-wrapper" style={{
      backgroundImage: "url('/crapsgame/images/stock.jpg')",
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      position: 'relative',
      minHeight: '100%',
      flex: 1,
      display: 'flex',
      flexDirection: 'column'
    }}>
      <div className="stock-overlay" style={{
        position: 'absolute',
        inset: 0,
        backgroundColor: 'rgba(0,0,0,0.7)',
        zIndex: 0
      }} />
      <div className="stock-dashboard" style={{ position: 'relative', zIndex: 1, flex: 1 }}>

        {hasData ? (
          /* ---- RESULT VIEW (dual-pane) ---- */
          <div className="container">
            {/* Header */}
            <div className="stock-result-header">
              <div>
                <button
                  className="btn btn-ghost"
                  onClick={handleBack}
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

            {/* Inline error */}
            {error && (
              <div className="alert-error" style={{ marginBottom: '16px' }}>
                {error}
              </div>
            )}

            {/* Quick stat cards */}
            <div className="stat-cards-grid">
              <NumberStat value={stockData.basicInfo?.marketCap ?? 'N/A'} label="Market Cap" />
              <NumberStat value={stockData.basicInfo?.fullTimeEmployees ?? 'N/A'} label="Employees" />
              <NumberStat value={stockData.basicInfo?.totalRevenue ?? 'N/A'} label="Total Revenue" />
              <NumberStat value={stockData.basicInfo?.trailingEps ?? 'N/A'} label="EPS" />
            </div>

            {/* ── Dual-pane layout ── */}
            <div className="dash-layout">
              {/* Sidebar */}
              <DashboardSidebar
                activeView={activeView}
                onViewChange={setActiveView}
                symbol={stockSymbol}
              />

              {/* Main panel */}
              <div className="dash-main">
                {activeView === 'graph' && (
                  <GraphView
                    symbol={stockSymbol}
                    priceHistoryFallback={stockData.priceHistory}
                  />
                )}

                {activeView === 'info' && (
                  <Suspense
                    fallback={
                      <div className="dash-suspense-fallback">
                        <div className="stock-spinner" />
                      </div>
                    }
                  >
                    <CompanyInfoView
                      symbol={stockSymbol}
                      basicInfo={stockData.basicInfo}
                    />
                  </Suspense>
                )}
              </div>
            </div>

            {/* News / Sentiment / Earnings (preserved, below fold) */}
            <div className="stock-content-grid" style={{ marginTop: 'var(--gap-lg)' }}>
              <div className="stock-content-card">
                <h3>Recent News</h3>
                <NewsList newsLinks={stockData.newsArticles ?? []} />
              </div>

              <div className="stock-content-card">
                <h3>News Sentiment</h3>
                {stockData.newsTextAnalysis ? (
                  <NewsSentimentDoughnut stockAnalysisJson={stockData} />
                ) : (
                  <div style={{ color: 'var(--text-muted)' }}>No sentiment data</div>
                )}
              </div>

              <div className="stock-content-card">
                <h3>Future Earnings</h3>
                {stockData.futureEarningsDates?.length > 0 ? (
                  stockData.futureEarningsDates.map((date: string) => (
                    <div key={date} className="earnings-date">{date}</div>
                  ))
                ) : (
                  <div style={{ color: 'var(--text-muted)' }}>No upcoming earnings</div>
                )}
              </div>
            </div>
          </div>

        ) : (
          /* ---- INPUT VIEW (unchanged) ---- */
          <div className="stock-input-view">
            <h1>Stock Dashboard</h1>
            <p>Enter a stock symbol to analyze (e.g. MSFT, AAPL)</p>

            {error && <div className="alert-error">{error}</div>}

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

            <div style={{ width: '100%', maxWidth: '700px', marginTop: '32px' }}>
              <StockCard />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default StockDashboard
