import React, { useEffect, useState } from 'react'
import { Doughnut } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js'

ChartJS.register(ArcElement, Tooltip, Legend)

type NewsSentimentDoughnutProps = {
  stockAnalysisJson: any
}

/**
 * Doughnut chart for news sentiment breakdown.
 * Styled for dark Brutalist Lite theme.
 */
const NewsSentimentDoughnut: React.FC<NewsSentimentDoughnutProps> = ({ stockAnalysisJson }) => {
  const [positive, setPositive] = useState(0)
  const [neutral, setNeutral] = useState(0)
  const [negative, setNegative] = useState(0)

  useEffect(() => {
    const data = stockAnalysisJson?.newsTextAnalysis?.data
    if (data) {
      setPositive(data.sentiment?.positive || 0)
      setNeutral(data.sentiment?.neutral || 0)
      setNegative(data.sentiment?.negative || 0)
    }
  }, [stockAnalysisJson])

  const doughnutData = {
    labels: ['Positive', 'Neutral', 'Negative'],
    datasets: [
      {
        data: [positive, neutral, negative],
        backgroundColor: ['#22c55e', '#eab308', '#ef4444'],
        borderColor: '#1e1e1e',
        borderWidth: 2,
      },
    ],
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '60%',
    plugins: {
      legend: {
        display: true,
        position: 'bottom' as const,
        labels: {
          boxWidth: 12,
          boxHeight: 12,
          padding: 12,
          font: { size: 11 },
          color: '#888888',
        },
      },
      tooltip: {
        backgroundColor: '#1e1e1e',
        titleColor: '#f0f0f0',
        bodyColor: '#888888',
        borderColor: '#2a2a2a',
        borderWidth: 1,
        cornerRadius: 4,
      },
    },
  }

  return (
    <div style={{ width: '100%', height: '180px' }}>
      <Doughnut data={doughnutData} options={options} />
    </div>
  )
}

export default NewsSentimentDoughnut
