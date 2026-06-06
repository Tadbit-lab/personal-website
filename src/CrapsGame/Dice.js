import { jsx as _jsx } from "react/jsx-runtime";
/**
 * CSS-only die face. Renders 1–6 dots using CSS Grid.
 * The `rolling` prop triggers a rotate animation.
 */
const Dice = ({ value, rolling }) => {
    const clampedValue = Math.max(1, Math.min(6, value));
    const dots = Array.from({ length: clampedValue }, (_, i) => (_jsx("span", { className: "die-dot" }, i)));
    return (_jsx("div", { className: `die-face${rolling ? ' rolling' : ''}`, "data-value": clampedValue, "aria-label": `Die showing ${clampedValue}`, children: dots }));
};
export default Dice;
