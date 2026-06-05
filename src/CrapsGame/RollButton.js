import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * Roll and Reset buttons for the Craps game.
 * Roll = flat solid blue. Reset = flat red outline (no fill).
 */
const RollButton = ({ onRoll, onReset, disabled, rolling }) => {
    return (_jsxs("div", { className: "craps-action-buttons", children: [_jsx("button", { className: "btn btn-primary", onClick: onRoll, disabled: disabled || rolling, id: "roll-dice-btn", children: rolling ? 'Rolling…' : 'Roll Dice' }), _jsx("button", { className: "btn btn-outline-red", onClick: onReset, id: "reset-game-btn", children: "Reset Game" })] }));
};
export default RollButton;
