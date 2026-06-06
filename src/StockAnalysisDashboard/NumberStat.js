import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import numabbr from 'numabbr';
/**
 * Simple stat card with a large value and a label.
 * No styled-components — uses plain CSS classes from StockAnalysisDashboard.css.
 */
function NumberStat({ value, label }) {
    const formatted = typeof value === 'number' ? numabbr(value) : value;
    return (_jsxs("div", { className: "stat-card", children: [_jsx("div", { className: "stat-card-label", children: label }), _jsx("div", { className: "stat-card-value", children: formatted })] }));
}
export default NumberStat;
