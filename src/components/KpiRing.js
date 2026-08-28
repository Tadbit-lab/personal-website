import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
const KpiRing = ({ label, value }) => {
    // Clamp value for ring visual progress (0 to 100)
    const visualValue = Math.min(100, Math.max(0, Math.abs(value)));
    const circumference = 2 * Math.PI * 42;
    const offset = circumference - (visualValue / 100) * circumference;
    const isNegative = value < 0;
    return (_jsxs("div", { className: `kpi-ring ${isNegative ? 'negative' : ''}`, "aria-label": `${label}: ${value}%`, children: [_jsxs("svg", { viewBox: "0 0 100 100", "aria-hidden": "true", children: [_jsx("circle", { className: "kpi-ring-track", cx: "50", cy: "50", r: "42" }), _jsx("circle", { className: "kpi-ring-value", cx: "50", cy: "50", r: "42", strokeDasharray: circumference, strokeDashoffset: offset, stroke: isNegative ? 'var(--red)' : 'var(--teal)' })] }), _jsxs("div", { children: [_jsxs("strong", { children: [isNegative ? '' : '+', value, "%"] }), _jsx("span", { children: label })] })] }));
};
export default KpiRing;
