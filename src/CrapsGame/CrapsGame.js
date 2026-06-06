import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useCallback, useMemo } from 'react';
import Dice from './Dice';
import StatsTable from './StatsTable';
import RollButton from './RollButton';
import './CrapsGame.css';
/* ===========================
   COMPONENT
   =========================== */
function CrapsGame() {
    // Dice state
    const [die1, setDie1] = useState(1);
    const [die2, setDie2] = useState(1);
    const [rolling, setRolling] = useState(false);
    // Game state
    const [phase, setPhase] = useState('comeout');
    const [pointNumber, setPointNumber] = useState(null);
    const [betType, setBetType] = useState('pass');
    const [betAmount, setBetAmount] = useState(10);
    const [balance, setBalance] = useState(1000);
    // Stats
    const [totalRolls, setTotalRolls] = useState(0);
    const [wins, setWins] = useState(0);
    const [losses, setLosses] = useState(0);
    const [currentStreak, setCurrentStreak] = useState(0);
    const [streakType, setStreakType] = useState('none');
    // UI
    const [message, setMessage] = useState('Place your bet and roll the dice.');
    const [messageType, setMessageType] = useState('neutral');
    const [history, setHistory] = useState([]);
    /* ===========================
       ROLL LOGIC — Accurate Craps Rules
       =========================== */
    const rollDice = useCallback(() => {
        if (rolling)
            return;
        const clampedBet = Math.max(1, Math.min(betAmount, balance));
        if (clampedBet > balance || balance <= 0) {
            setMessage('Insufficient balance.');
            setMessageType('lose');
            return;
        }
        setRolling(true);
        // Simulate roll delay
        setTimeout(() => {
            const d1 = Math.floor(Math.random() * 6) + 1;
            const d2 = Math.floor(Math.random() * 6) + 1;
            const total = d1 + d2;
            setDie1(d1);
            setDie2(d2);
            setTotalRolls(prev => prev + 1);
            setRolling(false);
            let rollResult;
            if (phase === 'comeout') {
                /* ---- COME OUT ROLL ---- */
                if (total === 7 || total === 11) {
                    // Natural: Pass wins, Don't Pass loses
                    if (betType === 'pass') {
                        rollResult = 'win';
                        handleWin(clampedBet, `Natural ${total}! Pass Line wins.`);
                    }
                    else {
                        rollResult = 'loss';
                        handleLoss(clampedBet, `Natural ${total}. Don't Pass loses.`);
                    }
                }
                else if (total === 2 || total === 3) {
                    // Craps (2, 3): Pass loses, Don't Pass wins
                    if (betType === 'pass') {
                        rollResult = 'loss';
                        handleLoss(clampedBet, `Craps ${total}. Pass Line loses.`);
                    }
                    else {
                        rollResult = 'win';
                        handleWin(clampedBet, `Craps ${total}! Don't Pass wins.`);
                    }
                }
                else if (total === 12) {
                    // 12: Pass loses, Don't Pass pushes (tie)
                    if (betType === 'pass') {
                        rollResult = 'loss';
                        handleLoss(clampedBet, `Craps 12. Pass Line loses.`);
                    }
                    else {
                        rollResult = 'point'; // push — no win/loss
                        setMessage(`Rolled 12. Don't Pass pushes (tie). Roll again.`);
                        setMessageType('point');
                    }
                }
                else {
                    // Point established (4, 5, 6, 8, 9, 10)
                    rollResult = 'point';
                    setPointNumber(total);
                    setPhase('point');
                    setMessage(`Point is ${total}. Roll again to hit it (or 7 out).`);
                    setMessageType('point');
                }
            }
            else {
                /* ---- POINT PHASE ---- */
                if (total === pointNumber) {
                    // Hit the point: Pass wins, Don't Pass loses
                    if (betType === 'pass') {
                        rollResult = 'win';
                        handleWin(clampedBet, `Hit the point ${total}! Pass Line wins.`);
                    }
                    else {
                        rollResult = 'loss';
                        handleLoss(clampedBet, `Point ${total} hit. Don't Pass loses.`);
                    }
                    setPhase('comeout');
                    setPointNumber(null);
                }
                else if (total === 7) {
                    // Seven out: Pass loses, Don't Pass wins
                    if (betType === 'pass') {
                        rollResult = 'loss';
                        handleLoss(clampedBet, `Seven out! Pass Line loses.`);
                    }
                    else {
                        rollResult = 'win';
                        handleWin(clampedBet, `Seven out! Don't Pass wins.`);
                    }
                    setPhase('comeout');
                    setPointNumber(null);
                }
                else {
                    // Neither point nor 7 — keep rolling
                    rollResult = 'point';
                    setMessage(`Rolled ${total}. Point is still ${pointNumber}. Roll again.`);
                    setMessageType('neutral');
                }
            }
            setHistory(prev => [{
                    roll: total,
                    die1: d1,
                    die2: d2,
                    result: rollResult,
                    betType,
                }, ...prev].slice(0, 50));
        }, 500);
    }, [rolling, betAmount, balance, phase, betType, pointNumber]);
    /* ===========================
       WIN / LOSS HANDLERS
       =========================== */
    function handleWin(amount, msg) {
        setBalance(prev => prev + amount);
        setWins(prev => prev + 1);
        setMessage(msg);
        setMessageType('win');
        setCurrentStreak(prev => streakType === 'win' ? prev + 1 : 1);
        setStreakType('win');
    }
    function handleLoss(amount, msg) {
        setBalance(prev => prev - amount);
        setLosses(prev => prev + 1);
        setMessage(msg);
        setMessageType('lose');
        setCurrentStreak(prev => streakType === 'loss' ? prev + 1 : 1);
        setStreakType('loss');
    }
    /* ===========================
       RESET
       =========================== */
    const resetGame = useCallback(() => {
        setDie1(1);
        setDie2(1);
        setPhase('comeout');
        setPointNumber(null);
        setBalance(1000);
        setTotalRolls(0);
        setWins(0);
        setLosses(0);
        setCurrentStreak(0);
        setStreakType('none');
        setMessage('Place your bet and roll the dice.');
        setMessageType('neutral');
        setHistory([]);
    }, []);
    /* ===========================
       MEMOIZED HISTORY LIST
       =========================== */
    const recentHistory = useMemo(() => history.slice(0, 20), [history]);
    /* ===========================
       RENDER
       =========================== */
    return (_jsxs("div", { className: "craps-game", children: [_jsxs("div", { className: "craps-header", children: [_jsx("h1", { children: "Craps Simulator" }), _jsx("p", { children: "Accurate Pass Line and Don't Pass rules" })] }), _jsxs("div", { className: "craps-layout", children: [_jsxs("div", { className: "craps-main", children: [_jsxs("div", { className: "phase-indicator", children: ["Phase: ", _jsx("span", { className: "phase-value", children: phase === 'comeout' ? 'COME OUT' : `POINT — ${pointNumber}` })] }), _jsxs("div", { className: "dice-area", children: [_jsx(Dice, { value: die1, rolling: rolling }), _jsx(Dice, { value: die2, rolling: rolling })] }), _jsx("div", { className: `craps-message ${messageType}`, children: message }), _jsxs("div", { className: "craps-controls", children: [_jsxs("div", { className: "craps-bet-row", children: [_jsxs("div", { children: [_jsx("label", { htmlFor: "craps-bet-type", children: "Bet Type" }), _jsxs("select", { id: "craps-bet-type", value: betType, onChange: (e) => setBetType(e.target.value), disabled: phase === 'point' || rolling, children: [_jsx("option", { value: "pass", children: "Pass Line" }), _jsx("option", { value: "dontpass", children: "Don't Pass" })] })] }), _jsxs("div", { children: [_jsx("label", { htmlFor: "craps-bet-amount", children: "Bet Amount ($)" }), _jsx("input", { type: "number", id: "craps-bet-amount", min: 1, max: balance, value: betAmount, onChange: (e) => setBetAmount(Math.max(1, parseInt(e.target.value) || 1)), disabled: rolling })] })] }), _jsx(RollButton, { onRoll: rollDice, onReset: resetGame, disabled: balance <= 0, rolling: rolling })] }), recentHistory.length > 0 && (_jsxs("div", { className: "history-card", children: [_jsx("h3", { children: "Roll History" }), recentHistory.map((entry, i) => (_jsxs("div", { className: "history-item", children: [_jsxs("span", { children: ["[", entry.die1, "+", entry.die2, "] = ", entry.roll, ' ', "(", entry.betType === 'pass' ? 'Pass' : "Don't Pass", ")"] }), _jsx("span", { style: {
                                                    color: entry.result === 'win'
                                                        ? 'var(--color-green)'
                                                        : entry.result === 'loss'
                                                            ? 'var(--color-red)'
                                                            : 'var(--text-muted)'
                                                }, children: entry.result === 'win' ? 'WIN' : entry.result === 'loss' ? 'LOSS' : '—' })] }, i)))] }))] }), _jsxs("div", { className: "craps-sidebar", children: [_jsxs("div", { className: "balance-display", children: [_jsx("div", { className: "balance-label", children: "Balance" }), _jsxs("div", { className: "balance-value", style: {
                                            color: balance > 1000
                                                ? 'var(--color-green)'
                                                : balance < 1000
                                                    ? 'var(--color-red)'
                                                    : 'var(--text-primary)'
                                        }, children: ["$", balance.toLocaleString()] })] }), _jsx(StatsTable, { totalRolls: totalRolls, wins: wins, losses: losses, currentStreak: currentStreak, streakType: streakType })] })] })] }));
}
export default CrapsGame;
