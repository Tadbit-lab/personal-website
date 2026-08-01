import { Line } from 'react-chartjs-2'
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Tooltip } from 'chart.js'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip)

interface StockChartProps { values: number[]; labels: string[]; positive: boolean }

function StockChart({ values, labels, positive }: StockChartProps) {
  const color = positive ? '#22c55e' : '#ef4444'
  const data = {
    labels,
    datasets: [{
      data: values,
      borderColor: color,
      borderWidth: 2,
      pointRadius: 0,
      pointHoverRadius: 0,
      fill: false,
      tension: 0.2,
    }],
  }
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 0 },
    plugins: {
      legend: { display: false },
      tooltip: { displayColors: false, backgroundColor: '#111827', titleColor: '#f8fafc', bodyColor: '#cbd5e1', borderColor: 'rgba(255,255,255,0.1)', borderWidth: 1 },
    },
    scales: {
      x: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#64748b', maxTicksLimit: 6 } },
      y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#64748b', callback: (value: string | number) => `$${value}` } },
    },
  }
  return <div className="chart-wrap"><Line data={data} options={options} /></div>
}

export default StockChart
