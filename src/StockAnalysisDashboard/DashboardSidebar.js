import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
const ITEMS = [
    {
        id: 'graph',
        label: 'Graph',
        icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
    </svg>`,
    },
    {
        id: 'info',
        label: 'Company Info',
        icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <line x1="12" y1="8" x2="12" y2="12"/>
      <line x1="12" y1="16" x2="12.01" y2="16"/>
    </svg>`,
    },
];
function DashboardSidebar({ activeView, onViewChange, symbol }) {
    return (_jsxs(_Fragment, { children: [_jsxs("aside", { className: "dash-sidebar", "aria-label": "Dashboard navigation", children: [_jsx("div", { className: "dash-sidebar-symbol", children: symbol }), _jsx("nav", { className: "dash-sidebar-nav", children: ITEMS.map((item) => (_jsxs("button", { id: `dash-nav-${item.id}`, className: `dash-sidebar-nav-item${activeView === item.id ? ' active' : ''}`, onClick: () => onViewChange(item.id), "aria-current": activeView === item.id ? 'page' : undefined, children: [_jsx("span", { className: "dash-nav-icon", dangerouslySetInnerHTML: { __html: item.icon } }), _jsx("span", { children: item.label })] }, item.id))) })] }), _jsx("div", { className: "dash-mobile-tabs", role: "tablist", "aria-label": "Dashboard views", children: ITEMS.map((item) => (_jsxs("button", { id: `dash-tab-${item.id}`, role: "tab", className: `dash-tab-btn${activeView === item.id ? ' active' : ''}`, onClick: () => onViewChange(item.id), "aria-selected": activeView === item.id, children: [_jsx("span", { className: "dash-nav-icon", dangerouslySetInnerHTML: { __html: item.icon } }), _jsx("span", { children: item.label })] }, item.id))) })] }));
}
export default DashboardSidebar;
