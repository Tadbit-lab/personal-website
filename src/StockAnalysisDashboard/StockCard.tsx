import { useState, useEffect, useMemo } from 'react'

/* ===========================
   SIMULATED TOP 5 STOCKS
   Generates random price fluctuations every interval.
   =========================== */

interface SimulatedStock {
  symbol: string
  name: string
  basePrice: number
}

interface StockRow {
  symbol: string
  name: string
  price: number
  change: number
}

const STOCKS: SimulatedStock[] = [
  { symbol: 'AAPL', name: 'Apple Inc.', basePrice: 198.50 },
  { symbol: 'MSFT', name: 'Microsoft Corp.', basePrice: 442.30 },
  { symbol: 'GOOGL', name: 'Alphabet Inc.', basePrice: 178.60 },
  { symbol: 'AMZN', name: 'Amazon.com Inc.', basePrice: 193.20 },
  { symbol: 'NVDA', name: 'NVIDIA Corp.', basePrice: 135.40 },
]

function generatePrices(stocks: SimulatedStock[]): StockRow[] {
  return stocks.map(s => {
    const fluctuation = (Math.random() - 0.5) * 4
    const price = parseFloat((s.basePrice + fluctuation).toFixed(2))
    const change = parseFloat(((fluctuation / s.basePrice) * 100).toFixed(2))
    return { symbol: s.symbol, name: s.name, price, change }
  })
}

/**
 * Flat table showing top 5 stocks with simulated price fluctuation.
 * Green text for positive change, red for negative.
 */
function StockCard() {
  const [rows, setRows] = useState<StockRow[]>(() => generatePrices(STOCKS))

  useEffect(() => {
    const interval = setInterval(() => {
      setRows(generatePrices(STOCKS))
    }, 5000)

    return () => clearInterval(interval)
  }, [])

  const tableRows = useMemo(() => rows.map(row => (
    <tr key={row.symbol}>
      <td style={{ fontWeight: 600 }}>{row.symbol}</td>
      <td className="text-secondary">{row.name}</td>
      <td className="mono" style={{ textAlign: 'right' }}>
        ${row.price.toFixed(2)}
      </td>
      <td
        className="mono"
        style={{
          textAlign: 'right',
          color: row.change >= 0 ? 'var(--color-green)' : 'var(--color-red)',
        }}
      >
        {row.change >= 0 ? '+' : ''}{row.change}%
      </td>
    </tr>
  )), [rows])

  return (
    <div className="stock-table-container">
      <h3>Market Overview</h3>
      <table>
        <thead>
          <tr>
            <th>Symbol</th>
            <th>Name</th>
            <th style={{ textAlign: 'right' }}>Price</th>
            <th style={{ textAlign: 'right' }}>Change</th>
          </tr>
        </thead>
        <tbody>
          {tableRows}
        </tbody>
      </table>
    </div>
  )
}

export default StockCard
