import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import Dice from '../components/Dice';
import BettingTable from '../components/BettingTable';
function Craps() {
    const [dice, setDice] = useState([3, 4]);
    const [rolling, setRolling] = useState(false);
    const [phase, setPhase] = useState('comeout');
    const [point, setPoint] = useState(null);
    const [balance, setBalance] = useState(1000);
    const [bet, setBet] = useState('pass');
    const [amount, setAmount] = useState(25);
    const [message, setMessage] = useState('Place a wager to begin the come-out roll.');
    const audio = useRef({});
    const soundBase = `${import.meta.env.BASE_URL}sounds/`;
    useEffect(() => { ['dice-roll', 'dice-hit', 'win', 'lose', 'welcome'].forEach((name) => { const sound = new Audio(`${soundBase}${name}.mp3`); sound.preload = 'auto'; audio.current[name] = sound; }); }, [soundBase]);
    const play = (name) => { const sound = audio.current[name]; if (sound) {
        sound.currentTime = 0;
        void sound.play().catch(() => undefined);
    } };
    const roll = () => { if (rolling || balance < amount)
        return; setRolling(true); play('dice-roll'); setTimeout(() => { const next = [Math.ceil(Math.random() * 6), Math.ceil(Math.random() * 6)]; const total = next[0] + next[1]; setDice(next); play('dice-hit'); let won = null; let text = `Rolled ${total}.`; if (bet === 'field')
        won = [3, 4, 9, 10, 11].includes(total);
    else if (bet === 'place6' || bet === 'place8')
        won = total === Number(bet.slice(-1));
    else if (phase === 'comeout') {
        if ([7, 11].includes(total))
            won = bet === 'pass';
        else if ([2, 3].includes(total))
            won = bet === 'dontpass';
        else if (total === 12)
            won = bet === 'dontpass' ? null : false;
        else {
            setPoint(total);
            setPhase('point');
            text = `Point is ${total}. Roll it again before seven.`;
        }
    }
    else if (total === point || total === 7) {
        won = total === point ? bet === 'pass' : bet === 'dontpass';
        setPhase('comeout');
        setPoint(null);
        text = total === 7 ? 'Seven out.' : `Point ${total} hit.`;
    }
    else
        text = `Rolled ${total}. Point remains ${point}.`; if (won === true) {
        setBalance((value) => value + amount);
        play('win');
        text += ' You win.';
    }
    else if (won === false) {
        setBalance((value) => value - amount);
        play('lose');
        text += ' Wager lost.';
    } setMessage(text); setRolling(false); }, 550); };
    return _jsxs("main", { className: "craps-page page-image", style: { backgroundImage: `url('${import.meta.env.BASE_URL}images/julian-paefgen-uxU_jyu9e7U-unsplash.jpg')` }, children: [_jsx("div", { className: "image-overlay" }), _jsxs("header", { className: "product-nav product-nav-overlay", children: [_jsx(Link, { to: "/", className: "brand", children: "PERSONAL SYSTEMS" }), _jsxs("nav", { children: [_jsx(Link, { className: "current", to: "/craps", children: "Craps" }), _jsx(Link, { to: "/dashboard", children: "Dashboard" })] }), _jsx("span", { className: "status-badge", children: "TABLE 04" })] }), _jsxs("section", { className: "craps-layout-new", children: [_jsxs("div", { className: "craps-main-new", children: [_jsxs("div", { className: "table-header", children: [_jsxs("div", { children: [_jsx("p", { className: "eyebrow", children: "LIVE TABLE / PASS LINE" }), _jsx("h1", { children: "Computerized Craps" })] }), _jsxs("div", { className: "point-display", children: [_jsx("small", { children: "POINT" }), _jsx("strong", { children: point ?? 'OFF' })] })] }), _jsxs("div", { className: "felt-table", style: { backgroundColor: 'rgba(6, 19, 16, .72)', backgroundImage: `url('${import.meta.env.BASE_URL}images/dice-on-craps-table-2260559.jpg')`, backgroundBlendMode: 'multiply' }, children: [_jsxs("div", { className: "roll-status", children: [_jsx("span", { className: rolling ? 'pulse-dot' : 'live-dot' }), rolling ? 'Rolling dice' : phase === 'point' ? `Point ${point}` : 'Come-out roll'] }), _jsxs("div", { className: "dice-row", children: [_jsx(Dice, { value: dice[0], rolling: rolling }), _jsx(Dice, { value: dice[1], rolling: rolling })] }), _jsx("p", { className: `game-message${message.toLowerCase().includes('win') ? ' win-message' : message.toLowerCase().includes('lost') ? ' lose-message' : ''}`, role: "status", children: message }), _jsxs("button", { className: "roll-button", type: "button", onClick: roll, disabled: rolling || balance < amount, children: [rolling ? 'Rolling...' : 'Roll dice', " ", _jsx("span", { children: "\u2197" })] })] }), _jsxs("div", { className: "table-metrics", children: [_jsxs("div", { children: [_jsx("small", { children: "Last roll" }), _jsxs("strong", { children: [dice[0], " + ", dice[1], " = ", dice[0] + dice[1]] })] }), _jsxs("div", { children: [_jsx("small", { children: "Session" }), _jsxs("strong", { children: ["Come-out ", phase === 'comeout' ? 'active' : 'in play'] })] })] })] }), _jsxs("aside", { className: "craps-sidebar-new", children: [_jsxs("div", { className: "balance-panel", children: [_jsx("small", { children: "AVAILABLE BALANCE" }), _jsxs("strong", { children: ["$", balance.toLocaleString()] }), _jsxs("span", { className: balance >= 1000 ? 'positive' : 'negative', children: [balance >= 1000 ? '+$0.00' : `-$${(1000 - balance).toFixed(2)}`, " session P/L"] })] }), _jsx(BettingTable, { selectedBet: bet, onSelectBet: (value) => { setBet(value); play('chip'); }, amount: amount, onAmountChange: setAmount, disabled: rolling || phase === 'point' })] })] })] });
}
export default Craps;
