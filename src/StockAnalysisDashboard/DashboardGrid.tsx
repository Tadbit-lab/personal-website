// DashboardGrid.tsx
import { useEffect } from 'react'
import { GridStack } from 'gridstack'
import 'gridstack/dist/gridstack.min.css'
import { DashboardGridContent } from './StockAnalysisDashboard'
import NumberStat from './NumberStat'
import LineChartContent from './LineChartContent'
import NewsList from './newsLinks'
import { StickyTitle, GridNoScroll } from './StockAnalysisDashboard'
import NewsSentimentDoughnut from './NewsSentimentDoughnut'

function DashboardGrid({ StockData }: { StockData: any }) {
  useEffect(() => {
    GridStack.init()
  }, [])

  return (
    <div className="dashboard-grid">
      <h2 style={{ color: 'white' }}>Analysis Result</h2>

      <div className="grid-stack">
        {/* =======================
            First Row: Key Stats
        ======================= */}
        <div className="grid-stack-item" gs-w="3">
          <div className="grid-stack-item-content">
            <DashboardGridContent>
              <NumberStat
                value={StockData?.basicInfo?.marketCap ?? 'N/A'}
                label="Market Cap"
                center={true}
              />
            </DashboardGridContent>
          </div>
        </div>

        <div className="grid-stack-item" gs-w="3">
          <div className="grid-stack-item-content">
            <DashboardGridContent>
              <NumberStat
                value={StockData?.basicInfo?.fullTimeEmployees ?? 'N/A'}
                label="Employees"
                center={true}
              />
            </DashboardGridContent>
          </div>
        </div>

        <div className="grid-stack-item" gs-w="3">
          <div className="grid-stack-item-content">
            <DashboardGridContent>
              <NumberStat
                value={StockData?.basicInfo?.totalRevenue ?? 'N/A'}
                label="Total Revenue"
                center={true}
              />
            </DashboardGridContent>
          </div>
        </div>

        <div className="grid-stack-item" gs-w="3">
          <div className="grid-stack-item-content">
            <DashboardGridContent>
              <NumberStat
                value={StockData?.basicInfo?.trailingEps ?? 'N/A'}
                label="Earnings Per Share"
                center={true}
              />
            </DashboardGridContent>
          </div>
        </div>

        {/* =======================
            Second Row: Charts & Future Earnings
        ======================= */}
        <div className="grid-stack-item" gs-w="10" gs-h="3">
          <DashboardGridContent className="grid-stack-item-content">
            {StockData?.priceHistory ? (
              <LineChartContent priceHistory={StockData.priceHistory} />
            ) : (
              <div style={{ color: 'white', padding: '20px' }}>
                No price history available
              </div>
            )}
          </DashboardGridContent>
        </div>

        <div className="grid-stack-item" gs-w="2" gs-h="2">
          <DashboardGridContent className="grid-stack-item-content">
            <div style={{ marginBottom: '10px' }}>Future Earnings</div>
            {StockData?.futureEarningsDates?.length > 0 ? (
              StockData.futureEarningsDates.map((date: any) => (
                <div key={date}>{date}</div>
              ))
            ) : (
              <div>No upcoming earnings</div>
            )}
          </DashboardGridContent>
        </div>

        {/* =======================
            Third Row: News & Sentiment
        ======================= */}
        <div className="grid-stack-item" gs-w="5" gs-h="2">
          <DashboardGridContent className="grid-stack-item-content">
            <StickyTitle>
              <div style={{ marginBottom: '10px' }}>Recent News</div>
            </StickyTitle>
            <NewsList newsLinks={StockData?.newsArticles ?? []} />
          </DashboardGridContent>
        </div>

        <div className="grid-stack-item" gs-w="4" gs-h="2">
          <DashboardGridContent className="grid-stack-item-content">
            <GridNoScroll>
              <div className="grid-stack" style={{ height: '100%', width: '100%' }}>
                {StockData ? (
                  <NewsSentimentDoughnut stockAnalysisJson={StockData} />
                ) : (
                  <div style={{ color: 'white', padding: '20px' }}>
                    No sentiment data available
                  </div>
                )}
              </div>
            </GridNoScroll>
          </DashboardGridContent>
        </div>

        <div className="grid-stack-item" gs-w="3" gs-h="2">
          <DashboardGridContent className="grid-stack-item-content">
            {StockData?.newsTextAnalysis?.data?.wordCloudImage ? (
              <img
                src={`data:image/png;base64,${StockData.newsTextAnalysis.data.wordCloudImage}`}
                alt="Word Cloud"
                style={{ height: '100%', width: '100%' }}
              />
            ) : (
              <div style={{ color: 'white', padding: '20px' }}>No Word Cloud Available</div>
            )}
          </DashboardGridContent>
        </div>
      </div>
    </div>
  )
}

export default DashboardGrid
