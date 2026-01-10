import { Line } from "react-chartjs-2"
import { CategoryScale } from "chart.js"
import Chart from "chart.js/auto"
import {PrimaryColor} from './StockAnalysisDashboard'
Chart.register(CategoryScale)

function LineChartContent({ priceHistory }: { priceHistory: any }) {

  // ✅ Match backend keys: date & price
  if (
    !priceHistory ||
    !priceHistory.date ||
    !priceHistory.price ||
    priceHistory.date.length === 0
  ) {
    return <div>No price data available</div>
  }

  const LineChartData = {
    labels: priceHistory.date,
    datasets: [
      {
        data: priceHistory.price,
        borderColor: PrimaryColor,
        borderWidth: 2,
        pointRadius: 1,
        tension: 0.3,
      },
    ],
  }

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        minHeight: 'max-content',
      }}
    >
      <Line
        data={LineChartData}
        options={{
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
          },
          scales: {
            x: { display: true },
            y: { display: true },
          },
        }}
      />
    </div>
  )
}

export default LineChartContent
