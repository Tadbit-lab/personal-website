import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { Link } from 'react-router-dom';
import Watchlist from '../components/Watchlist';
import StockChart from '../components/StockChart';
const watchlist = [
    { symbol: 'AAPL', name: 'Apple Inc.', price: '189.84', change: '+1.24%', positive: true },
    { symbol: 'MSFT', name: 'Microsoft Corp.', price: '417.32', change: '+0.86%', positive: true },
    { symbol: 'NVDA', name: 'NVIDIA Corp.', price: '875.28', change: '+2.41%', positive: true },
    { symbol: 'TSLA', name: 'Tesla Inc.', price: '176.29', change: '-1.18%', positive: false },
    { symbol: 'AMZN', name: 'Amazon.com', price: '181.26', change: '+0.42%', positive: true },
];
const values = [182.2, 183.1, 181.8, 184.4, 185.2, 184.7, 186.3, 185.8, 187.4, 188.1, 187.6, 189.84];
const labels = ['09:30', '10:00', '10:30', '11:00', '11:30', '12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00'];
const stats = [['Market cap', '$2.91T'], ['Volume', '42.8M'], ['P/E ratio', '29.44'], ['52W high / low', '$199.62 / $164.08']];
function Dashboard() {
    const [selected, setSelected] = useState('AAPL');
    const [range, setRange] = useState('1D');
    const current = watchlist.find((item) => item.symbol === selected) ?? watchlist[0];
    return _jsxs("main", { className: "dashboard-page", children: [_jsxs("header", { className: "product-nav", children: [_jsx(Link, { to: "/", className: "brand", children: "PERSONAL SYSTEMS" }), _jsxs("nav", { children: [_jsx(Link, { to: "/craps", children: "Craps" }), _jsx(Link, { className: "current", to: "/dashboard", children: "Dashboard" })] }), _jsxs("span", { className: "status-badge", children: [_jsx("i", {}), " Market open"] })] }), _jsxs("div", { className: "dashboard-layout", children: [_jsx(Watchlist, { items: watchlist, selected: selected, onSelect: setSelected }), _jsxs("section", { className: "market-main", children: [_jsxs("div", { className: "market-header", children: [_jsxs("div", { children: [_jsxs("p", { className: "eyebrow", children: ["MARKET OVERVIEW / ", range] }), _jsxs("h1", { children: [current.symbol, " ", _jsx("span", { children: current.name })] })] }), _jsxs("div", { className: "price-block", children: [_jsxs("strong", { children: ["$", current.price] }), _jsxs("span", { className: current.positive ? 'positive' : 'negative', children: [current.change, " today"] })] })] }), _jsxs("div", { className: "chart-toolbar", children: [_jsx("div", { className: "range-tabs", children: ['1D', '5D', '1M', '6M', '1Y'].map((item) => _jsx("button", { type: "button", className: range === item ? 'selected' : '', onClick: () => setRange(item), children: item }, item)) }), _jsx("span", { className: "chart-note", children: "USD \u00B7 NASDAQ" })] }), _jsx("div", { className: "chart-panel", children: _jsx(StockChart, { values: values.map((value, index) => value + (range === '1D' ? 0 : index * .8)), labels: labels, positive: current.positive }) }), _jsxs("section", { className: "stats-panel", children: [_jsxs("div", { className: "section-heading", children: [_jsxs("div", { children: [_jsx("p", { className: "eyebrow", children: "FUNDAMENTALS" }), _jsx("h2", { children: "Market stats" })] }), _jsx("span", { className: "muted", children: "As of today" })] }), _jsx("div", { className: "stats-grid", children: stats.map(([label, value]) => _jsxs("div", { className: "stat-item", children: [_jsx("small", { children: label }), _jsx("strong", { children: value })] }, label)) })] })] })] })] });
}
export default Dashboard;
