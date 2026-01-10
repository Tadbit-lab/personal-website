import React, { useState } from 'react'
import './App.css'
import {
  analyzeStock,
  VerticalAlignContainer,
  VerticalAlignContent,
  DashboardGridContainer
} from './StockAnalysisDashboard/StockAnalysisDashboard'
import { Oval } from 'react-loader-spinner'
import './StockAnalysisDashboard/StockAnalysisDashboard.css'
import DashboardGrid from './StockAnalysisDashboard/DashboardGrid'

function StockAnalysisStock() {
  const [stockData, setStockData] = useState<any>(null)
  const [stockSymbol, setStockSymbol] = useState('')
  const [loading, setLoading] = useState(false)

  async function runStockAnalysis() {
    if (!stockSymbol) {
      alert('Please enter a stock symbol')
      return
    }

    setLoading(true)
    try {
      const gotStockData = await analyzeStock(stockSymbol)
      console.log('BACKEND DATA:', gotStockData)
      setStockData(gotStockData)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  // ======================
  // RESULT VIEW
  // ======================
  if (stockData !== null) {
    return (
      <VerticalAlignContainer id="stock-dashboard">
        <VerticalAlignContent>
          <DashboardGridContainer>
            <div>
              <div
                style={{ cursor: 'pointer', color: 'lightblue', marginBottom: '10px' }}
                onClick={() => setStockData(null)}
              >
                ← Back
              </div>

              <DashboardGrid StockData={stockData} />

              {/* <pre
                style={{
                  color: 'white',
                  background: 'rgba(0,0,0,0.7)',
                  padding: '15px',
                  marginTop: '20px',
                  textAlign: 'left',
                  overflowX: 'auto'
                }}
              >
                {JSON.stringify(stockData, null, 2)}
              </pre> */}
            </div>
          </DashboardGridContainer>
        </VerticalAlignContent>
      </VerticalAlignContainer>
    )
  }

  // ======================
  // INPUT VIEW
  // ======================
  return (
    <VerticalAlignContainer id="stock-dashboard">
      <VerticalAlignContent>
        <div className="main-section">
          <div id="stock-analysis-title">STOCK-ANALYSIS-DASHBOARD</div>

          <div id="stock-analysis-subtitle">
            Put in the stock symbol you'd like to analyze (e.g. MSFT)
          </div>

          {loading && (
            <Oval
              height={80}
              width={80}
              color="grey"
              secondaryColor="lightgrey"
              strokeWidth={2}
              ariaLabel="loading"
            />
          )}

          <input
            type="text"
            className="stock-analysis-dashboard-input"
            value={stockSymbol}
            onChange={(e) => setStockSymbol(e.target.value)}
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
      </VerticalAlignContent>
    </VerticalAlignContainer>
  )
}

export default StockAnalysisStock
