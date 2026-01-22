import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import './App.css';
import './StockAnalysisDashboard/StockAnalysisDashboard.css';
import { analyzeStock, VerticalAlignContainer, VerticalAlignContent, DashboardGridContainer } from './StockAnalysisDashboard/StockAnalysisDashboard';
import { Oval } from 'react-loader-spinner';
import DashboardGrid from './StockAnalysisDashboard/DashboardGrid';
/* ======================
   COMPONENT
====================== */
function StockAnalysisStock() {
    const [stockData, setStockData] = useState(null);
    const [stockSymbol, setStockSymbol] = useState('');
    const [loading, setLoading] = useState(false);
    /* ======================
       ACTIONS
    ====================== */
    async function runStockAnalysis() {
        if (!stockSymbol) {
            alert('Please enter a stock symbol');
            return;
        }
        setLoading(true);
        try {
            const response = await analyzeStock(stockSymbol);
            if (!response || !response.data || !response.data.basicInfo) {
                throw new Error('Invalid stock data returned');
            }
            // ✅ IMPORTANT: store ONLY response.data
            setStockData(response.data);
        }
        catch (err) {
            console.error(err);
            alert('Failed to fetch stock data. Try again.');
            setStockData(null);
        }
        finally {
            setLoading(false);
        }
    }
    const hasValidStockData = stockData !== null &&
        stockData.basicInfo &&
        Object.keys(stockData.basicInfo).length > 0;
    /* ======================
       RENDER
    ====================== */
    return (_jsx("div", { className: "stock-dashboard", children: hasValidStockData ? (
        /* ======================
           RESULT VIEW
        ====================== */
        _jsx(VerticalAlignContainer, { children: _jsx(VerticalAlignContent, { children: _jsx(DashboardGridContainer, { children: _jsxs("div", { children: [_jsx("div", { className: "back-button", onClick: () => setStockData(null), children: "\u2190 Back" }), _jsx(DashboardGrid, { StockData: stockData })] }) }) }) })) : (
        /* ======================
           INPUT VIEW
        ====================== */
        _jsxs("div", { className: "main-section", children: [_jsx("div", { id: "stock-analysis-title", children: "STOCK-ANALYSIS-DASHBOARD" }), _jsx("div", { id: "stock-analysis-subtitle", children: "Put in the stock symbol you'd like to analyze (e.g. MSFT)" }), loading && (_jsx(Oval, { height: 80, width: 80, color: "grey", secondaryColor: "lightgrey", strokeWidth: 2, ariaLabel: "loading" })), _jsx("input", { type: "text", className: "stock-analysis-dashboard-input", value: stockSymbol, onChange: (e) => setStockSymbol(e.target.value.toUpperCase()), disabled: loading }), _jsx("button", { className: "stock-analysis-dashboard-button", onClick: runStockAnalysis, disabled: loading, children: loading ? 'Analyzing…' : 'Analyze Stock' })] })) }));
}
export default StockAnalysisStock;
