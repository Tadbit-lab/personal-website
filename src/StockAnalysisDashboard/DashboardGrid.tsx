// Import core Gridstack + CSS
import  { useEffect } from 'react'
import { GridStack } from 'gridstack'
import 'gridstack/dist/gridstack.min.css'
import { DashboardGridContent } from './StockAnalysisDashboard'
import NumberStat from './NumberStat'
import LineChartContent from './LineChartContent'

function DashboardGrid({ StockData }: { StockData: any }) {

  useEffect(() => {
    GridStack.init()
  }, [])

  return (
    <div className="dashboard-grid">
      <h2 style={{ color: 'white' }}>Analysis Result</h2>

      <div className="grid-stack">

        <div className="grid-stack-item" gs-w="3">
          <div className="grid-stack-item-content">
            <DashboardGridContent>
              <NumberStat value={StockData.basicInfo.marketCap} 
              label="Market Cap"
              center={true} >
              </NumberStat>
            </DashboardGridContent>
          </div>
        </div>

        <div className="grid-stack-item" gs-w="3">
          <div className="grid-stack-item-content">
            <DashboardGridContent>
              <NumberStat value={StockData.basicInfo.fullTimeEmployees} 
              label="Employees" center={true}></NumberStat>
            </DashboardGridContent>
          </div>
        </div>

        <div className="grid-stack-item" gs-w="3">
          <div className="grid-stack-item-content">
            <DashboardGridContent>
              <NumberStat value={StockData.basicInfo.totalRevenue} 
              label="Total Revenue" center={true} >
              </NumberStat>
            </DashboardGridContent>
          </div>
        </div>

        <div className="grid-stack-item" gs-w="3">
          <div className="grid-stack-item-content">
            <DashboardGridContent>
                <NumberStat value={StockData.basicInfo.trailingEps} 
                label="Earnings Per Share" center={true}>
                </NumberStat>
            </DashboardGridContent>
          </div>
        </div>
         {/* Second row here */}
        <div className="grid-stack-item" gs-w="10" gs-h="3">
            <DashboardGridContent className="grid-stack-item-content">
                           <LineChartContent priceHistory={StockData.priceHistory}> 
                           </LineChartContent>
            </DashboardGridContent>
          </div>
          <div className="grid-stack-item" gs-w="2" gs-h="2">
            <DashboardGridContent className="grid-stack-item-content">
              <div style={{ marginBottom: '10px' }}>Future Earnings</div>
              {StockData.futureEarningsDates.map((date: any) => 
              <div key={date}>{date}</div>)}
            </DashboardGridContent>
          </div>
        </div>
      </div>
  )
}

export default DashboardGrid
