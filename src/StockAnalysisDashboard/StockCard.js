import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect, useMemo } from 'react';
const STOCKS = [
    { symbol: 'AAPL', name: 'Apple Inc.', basePrice: 198.50 },
    { symbol: 'MSFT', name: 'Microsoft Corp.', basePrice: 442.30 },
    { symbol: 'GOOGL', name: 'Alphabet Inc.', basePrice: 178.60 },
    { symbol: 'AMZN', name: 'Amazon.com Inc.', basePrice: 193.20 },
    { symbol: 'NVDA', name: 'NVIDIA Corp.', basePrice: 135.40 },
];
function generatePrices(stocks) {
    return stocks.map(s => {
        const fluctuation = (Math.random() - 0.5) * 4;
        const price = parseFloat((s.basePrice + fluctuation).toFixed(2));
        const change = parseFloat(((fluctuation / s.basePrice) * 100).toFixed(2));
        return { symbol: s.symbol, name: s.name, price, change };
    });
}
/**
 * Flat table showing top 5 stocks with simulated price fluctuation.
 * Green text for positive change, red for negative.
 */
function StockCard() {
    const [rows, setRows] = useState(() => generatePrices(STOCKS));
    useEffect(() => {
        const interval = setInterval(() => {
            setRows(generatePrices(STOCKS));
        }, 5000);
        return () => clearInterval(interval);
    }, []);
    const tableRows = useMemo(() => rows.map(row => (_jsxs("tr", { children: [_jsx("td", { style: { fontWeight: 600 }, children: row.symbol }), _jsx("td", { className: "text-secondary", children: row.name }), _jsxs("td", { className: "mono", style: { textAlign: 'right' }, children: ["$", row.price.toFixed(2)] }), _jsxs("td", { className: "mono", style: {
                    textAlign: 'right',
                    color: row.change >= 0 ? 'var(--color-green)' : 'var(--color-red)',
                }, children: [row.change >= 0 ? '+' : '', row.change, "%"] })] }, row.symbol))), [rows]);
    return (_jsxs("div", { className: "stock-table-container", children: [_jsx("h3", { children: "Market Overview" }), _jsxs("table", { children: [_jsx("thead", { children: _jsxs("tr", { children: [_jsx("th", { children: "Symbol" }), _jsx("th", { children: "Name" }), _jsx("th", { style: { textAlign: 'right' }, children: "Price" }), _jsx("th", { style: { textAlign: 'right' }, children: "Change" })] }) }), _jsx("tbody", { children: tableRows })] })] }));
}
export default StockCard;
