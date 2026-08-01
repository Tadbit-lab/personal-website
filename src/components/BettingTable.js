import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
const bets = [
    { id: 'pass', label: 'Pass Line', detail: '1:1' },
    { id: 'dontpass', label: "Don't Pass", detail: '1:1' },
    { id: 'field', label: 'Field', detail: '1:1 / 2:1 on 2, 12' },
    { id: 'place6', label: 'Place 6', detail: '7:6' },
    { id: 'place8', label: 'Place 8', detail: '7:6' },
];
function BettingTable({ selectedBet, onSelectBet, amount, onAmountChange, disabled }) {
    return _jsxs("section", { className: "betting-panel", "aria-labelledby": "betting-title", children: [_jsxs("div", { className: "section-heading", children: [_jsxs("div", { children: [_jsx("p", { className: "eyebrow", children: "WAGER CONSOLE" }), _jsx("h2", { id: "betting-title", children: "Active bets" })] }), _jsx("span", { className: "chip-label", children: "MIN $5" })] }), _jsx("div", { className: "bet-grid", children: bets.map((bet) => _jsxs("button", { className: `bet-option${selectedBet === bet.id ? ' selected' : ''}`, onClick: () => onSelectBet(bet.id), disabled: disabled, type: "button", children: [_jsx("strong", { children: bet.label }), _jsx("small", { children: bet.detail })] }, bet.id)) }), _jsx("label", { className: "field-label", htmlFor: "bet-amount", children: "Stake" }), _jsxs("div", { className: "stake-control", children: [_jsx("span", { children: "$" }), _jsx("input", { id: "bet-amount", type: "number", min: "5", step: "5", value: amount, onChange: (event) => onAmountChange(Math.max(5, Number(event.target.value) || 5)), disabled: disabled })] })] });
}
export default BettingTable;
