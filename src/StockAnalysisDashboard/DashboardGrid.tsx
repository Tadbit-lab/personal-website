// Import core Gridstack + CSS
import  { useEffect } from 'react'
import { GridStack } from 'gridstack'
import 'gridstack/dist/gridstack.min.css'
import { DashboardGridContent } from './StockAnalysisDashboard'
import NumberStat from './NumberStat'

function DashboardGrid({ StockData }: { StockData: any }) {

  useEffect(() => {
    GridStack.init()
  }, [])

  return (
    <div className="dashboard-grid">
      <h2 style={{ color: 'white' }}>Analysis Result</h2>

      <div className="grid-stack">

        <div className="grid-stack-item" gs-w="4">
          <div className="grid-stack-item-content">
            <DashboardGridContent>
              <NumberStat value={StockData.basicInfo.marketCap} 
              label="Market Cap">
              </NumberStat>
            </DashboardGridContent>
          </div>
        </div>

        <div className="grid-stack-item" gs-w="3">
          <div className="grid-stack-item-content">
            <DashboardGridContent>
              <NumberStat value={StockData.basicInfo.fullTimeEmployees} 
              label="Employees" ></NumberStat>
            </DashboardGridContent>
          </div>
        </div>

        <div className="grid-stack-item" gs-w="3">
          <div className="grid-stack-item-content">
            <DashboardGridContent>
              <NumberStat value={StockData.basicInfo.totalRevenue} 
              label="Total Revenue" >
              </NumberStat>
            </DashboardGridContent>
          </div>
        </div>

        <div className="grid-stack-item" gs-w="3">
          <div className="grid-stack-item-content">
            <DashboardGridContent>
                <NumberStat value={StockData.basicInfo.trailingEps} 
                label="Earnings Per Share" >
                </NumberStat>
            </DashboardGridContent>
          </div>
        </div>

      </div>
    </div>
  )
}

export default DashboardGrid
