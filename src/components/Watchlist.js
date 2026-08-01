import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
function Watchlist({ items, selected, onSelect }) {
    return _jsxs("aside", { className: "watchlist-panel", children: [_jsxs("div", { className: "panel-title", children: [_jsx("span", { children: "Watchlist" }), _jsx("span", { className: "live-dot", children: "LIVE" })] }), _jsx("div", { className: "watchlist-items", children: items.map((item) => _jsxs("button", { type: "button", className: `watchlist-item${item.symbol === selected ? ' active' : ''}`, onClick: () => onSelect(item.symbol), children: [_jsxs("span", { children: [_jsx("strong", { children: item.symbol }), _jsx("small", { children: item.name })] }), _jsxs("span", { className: "watch-price", children: [_jsxs("strong", { children: ["$", item.price] }), _jsx("small", { className: item.positive ? 'positive' : 'negative', children: item.change })] })] }, item.symbol)) })] });
}
export default Watchlist;
