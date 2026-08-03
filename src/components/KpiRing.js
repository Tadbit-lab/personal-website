import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
function KpiRing({ label, value }) {
    const normalized = Math.min(100, Math.max(0, value));
    const circumference = 2 * Math.PI * 42;
    const offset = circumference - (normalized / 100) * circumference;
    return (_jsxs("div", { className: "kpi-ring", "aria-label": `${label}: ${normalized}%`, children: [_jsxs("svg", { viewBox: "0 0 100 100", "aria-hidden": "true", children: [_jsx("circle", { className: "kpi-ring-track", cx: "50", cy: "50", r: "42" }), _jsx("circle", { className: "kpi-ring-value", cx: "50", cy: "50", r: "42", strokeDasharray: circumference, strokeDashoffset: offset })] }), _jsxs("div", { children: [_jsxs("strong", { children: [normalized, "%"] }), _jsx("span", { children: label })] })] }));
}
export default KpiRing;
