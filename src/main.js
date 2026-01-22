import { jsx as _jsx } from "react/jsx-runtime";
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import StockAnalysisStock from './StockAnalysisDashboard';
/* ✅ GLOBAL CSS FIRST */
import 'gridstack/dist/gridstack.min.css';
import './StockAnalysisDashboard/StockAnalysisDashboard.css';
import './StockAnalysisDashboard';
createRoot(document.getElementById('root')).render(_jsx(StrictMode, { children: _jsx(StockAnalysisStock, {}) }));
