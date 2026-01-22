import { useState } from 'react'
import './App.css'
import './StockAnalysisDashboard/StockAnalysisDashboard.css'
import {
  analyzeStock,
  VerticalAlignContainer,
  VerticalAlignContent,
  DashboardGridContainer
} from './StockAnalysisDashboard/StockAnalysisDashboard'
import { Oval } from 'react-loader-spinner'
import DashboardGrid from './StockAnalysisDashboard/DashboardGrid'

/* ======================
   TYPES
====================== */

interface StockDataType {
  basicInfo: Record<string, any>
  priceHistory: any
  futureEarningsDates: string[]
  newsArticles: any[]
  newsTextAnalysis: any
}

interface AnalyzeStockResponse {
  success: boolean
  ticker: string
  data: StockDataType
}

/* ======================
   STYLES
====================== */

const spinnerOverlayStyle: React.CSSProperties = {
  position: 'fixed',         // cover entire viewport
  top: 0,
  left: 0,
  width: '100vw',
  height: '100vh',
  display: 'flex',
  justifyContent: 'center',  // horizontal center
  alignItems: 'center',      // vertical center
  backgroundColor: 'rgba(0,0,0,0.3)', // optional overlay
  zIndex: 9999,
}

/* ======================
   COMPONENT
====================== */

function StockAnalysisStock() {
  const [stockData, setStockData] = useState<StockDataType | null>(null)
  const [stockSymbol, setStockSymbol] = useState<string>('')
  const [loading, setLoading] = useState<boolean>(false)

  /* ======================
     ACTIONS
  ====================== */

  async function runStockAnalysis() {
    if (!stockSymbol) {
      alert('Please enter a stock symbol')
      return
    }

    setLoading(true)

    try {
      const response: AnalyzeStockResponse = await analyzeStock(stockSymbol)

      if (!response || !response.data || !response.data.basicInfo) {
        throw new Error('Invalid stock data returned')
      }

      // ✅ store ONLY response.data
      setStockData(response.data)

    } catch (err) {
      console.error(err)
      alert('Failed to fetch stock data. Try again.')
      setStockData(null)
    } finally {
      setLoading(false)
    }
  }

  const hasValidStockData =
    stockData !== null &&
    stockData.basicInfo &&
    Object.keys(stockData.basicInfo).length > 0

  /* ======================
     RENDER
  ====================== */

  return (
    <div className="stock-dashboard">
      {hasValidStockData ? (
        /* ======================
           RESULT VIEW
        ====================== */
        <VerticalAlignContainer>
          <VerticalAlignContent>
            <DashboardGridContainer>
              <div>
                <div
                  className="back-button"
                  onClick={() => setStockData(null)}
                >
                  ← Back
                </div>

                <DashboardGrid StockData={stockData} />
              </div>
            </DashboardGridContainer>
          </VerticalAlignContent>
        </VerticalAlignContainer>
      ) : (
        /* ======================
           INPUT VIEW
        ====================== */
        <div className="main-section">
          <div id="stock-analysis-title">
            STOCK-ANALYSIS-DASHBOARD
          </div>

          <div id="stock-analysis-subtitle">
            Put in the stock symbol you'd like to analyze (e.g. MSFT)
          </div>

          {/* ======================
              CENTERED LOADING SPINNER
          ====================== */}
          {loading && (
            <div style={spinnerOverlayStyle}>
              <Oval
                height={80}
                width={80}
                color="#5F7280"
                secondaryColor="#ccc"
                strokeWidth={2}
                ariaLabel="loading"
              />
            </div>
          )}

          <input
            type="text"
            className="stock-analysis-dashboard-input"
            value={stockSymbol}
            onChange={(e) =>
              setStockSymbol(e.target.value.toUpperCase())
            }
            disabled={loading}
          />

          <button
            className="stock-analysis-dashboard-button"
            onClick={runStockAnalysis}
            disabled={loading}
          >
            {loading ? 'Analyzing…' : 'Analyze Stock'}
          </button>
        </div>
      )}
    </div>
  )
}

export default StockAnalysisStock
