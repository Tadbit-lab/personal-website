// import { useState } from 'react'
import './App.css'


function StockAnalysisStock() {
  async function runStockAnalysis() {
    alert("function called...")
  }

  // const [count, setCount] = useState(0)
   

  return (
    <>     

  
      <div className="main-section" id="stock-dashboard">
      <div id="stock-analysis-title">STOCK-ANALYSIS-DASHBOARD
      </div>
      <div id="stock-analysis-subtitle">Put in the stock symbol you'd like to analyze (e.g. MSFT)</div>
      <input type="text" className="stock-analysis-dashboard-input" placeholder="Enter stock symbol"></input>
      <button className="stock-analysis-dashboard-button" onClick={() => runStockAnalysis()}>Analyze Stock</button>
      <div id="stock-analysis-result"></div>
    </div>

  </>
      
 
   )
}

export default StockAnalysisStock
