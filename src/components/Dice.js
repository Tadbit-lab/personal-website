import { jsx as _jsx } from "react/jsx-runtime";
function Dice({ value, rolling }) {
    const dots = Array.from({ length: value }, (_, index) => _jsx("span", { className: "die-dot" }, index));
    return _jsx("div", { className: `die-face${rolling ? ' rolling' : ''}`, "aria-label": `Die showing ${value}`, children: dots });
}
export default Dice;
