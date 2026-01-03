import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import StockAnalysisStock from './StockAnalysisDashboard'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <StockAnalysisStock />
  </StrictMode>
)