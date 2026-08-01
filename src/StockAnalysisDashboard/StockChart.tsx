import { Line } from 'react-chartjs-2'
import { CategoryScale } from 'chart.js'
import Chart from 'chart.js/auto'
import { PrimaryColor } from './StockAnalysisDashboard'

Chart.register(CategoryScale)

interface StockChartProps {
  priceHistory: {
    date: string[]
    price: number[]
  }
}

/**
 * Flat, sharp line chart styled for Brutalist Lite.
 * - Blue line, no fill
 * - Subtle grid lines (#222)
 * - No legend
 */
function StockChart({ priceHistory }: StockChartProps) {
  if (
    !priceHistory ||
    !priceHistory.date ||
    !priceHistory.price ||
    priceHistory.date.length === 0
  ) {
    return (
      <div style={{ color: 'var(--text-muted)', padding: '20px' }}>
        No price data available
      </div>
    )
  }

  const data = {
    labels: priceHistory.date,
    datasets: [
      {
        data: priceHistory.price,
        borderColor: PrimaryColor,
        borderWidth: 2,
        pointRadius: 0,
        pointHoverRadius: 4,
        pointHoverBackgroundColor: PrimaryColor,
        tension: 0,
        fill: false,
      },
    ],
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#1e1e1e',
        titleColor: '#f0f0f0',
        bodyColor: '#888888',
        borderColor: '#2a2a2a',
        borderWidth: 1,
        cornerRadius: 0,
        padding: 10,
      },
    },
    scales: {
      x: {
        display: true,
        grid: {
          display: false,
        },
        ticks: {
          color: '#555555',
          font: { size: 10 },
          maxTicksLimit: 8,
        },
        border: {
          color: '#2a2a2a',
        },
      },
      y: {
        display: true,
        grid: {
          display: false,
        },
        ticks: {
          color: '#555555',
          font: { size: 10 },
        },
        border: {
          color: '#2a2a2a',
        },
      },
    },
    interaction: {
      intersect: false,
      mode: 'index' as const,
    },
  }

  return (
    <div style={{ width: '100%', height: '100%' }}>
      <Line data={data} options={options} />
    </div>
  )
}

export default StockChart
