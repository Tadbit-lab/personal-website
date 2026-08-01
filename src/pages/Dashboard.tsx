import { useState } from 'react'
import { Link } from 'react-router-dom'
import Watchlist, { WatchlistItem } from '../components/Watchlist'
import StockChart from '../components/StockChart'

const watchlist: WatchlistItem[] = [
  { symbol: 'AAPL', name: 'Apple Inc.', price: '189.84', change: '+1.24%', positive: true },
  { symbol: 'MSFT', name: 'Microsoft Corp.', price: '417.32', change: '+0.86%', positive: true },
  { symbol: 'NVDA', name: 'NVIDIA Corp.', price: '875.28', change: '+2.41%', positive: true },
  { symbol: 'TSLA', name: 'Tesla Inc.', price: '176.29', change: '-1.18%', positive: false },
  { symbol: 'AMZN', name: 'Amazon.com', price: '181.26', change: '+0.42%', positive: true },
]
const values = [182.2, 183.1, 181.8, 184.4, 185.2, 184.7, 186.3, 185.8, 187.4, 188.1, 187.6, 189.84]
const labels = ['09:30', '10:00', '10:30', '11:00', '11:30', '12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00']
const stats = [['Market cap', '$2.91T'], ['Volume', '42.8M'], ['P/E ratio', '29.44'], ['52W high / low', '$199.62 / $164.08']]

function Dashboard() {
  const [selected, setSelected] = useState('AAPL')
  const [range, setRange] = useState('1D')
  const current = watchlist.find((item) => item.symbol === selected) ?? watchlist[0]
  return <main className="dashboard-page"><header className="product-nav"><Link to="/" className="brand">PERSONAL SYSTEMS</Link><nav><Link to="/craps">Craps</Link><Link className="current" to="/dashboard">Dashboard</Link></nav><span className="status-badge"><i /> Market open</span></header><div className="dashboard-layout"><Watchlist items={watchlist} selected={selected} onSelect={setSelected} /><section className="market-main"><div className="market-header"><div><p className="eyebrow">MARKET OVERVIEW / {range}</p><h1>{current.symbol} <span>{current.name}</span></h1></div><div className="price-block"><strong>${current.price}</strong><span className={current.positive ? 'positive' : 'negative'}>{current.change} today</span></div></div><div className="chart-toolbar"><div className="range-tabs">{['1D', '5D', '1M', '6M', '1Y'].map((item) => <button type="button" className={range === item ? 'selected' : ''} onClick={() => setRange(item)} key={item}>{item}</button>)}</div><span className="chart-note">USD · NASDAQ</span></div><div className="chart-panel"><StockChart values={values.map((value, index) => value + (range === '1D' ? 0 : index * .8))} labels={labels} positive={current.positive} /></div><section className="stats-panel"><div className="section-heading"><div><p className="eyebrow">FUNDAMENTALS</p><h2>Market stats</h2></div><span className="muted">As of today</span></div><div className="stats-grid">{stats.map(([label, value]) => <div className="stat-item" key={label}><small>{label}</small><strong>{value}</strong></div>)}</div></section></section></div></main>
}

export default Dashboard
