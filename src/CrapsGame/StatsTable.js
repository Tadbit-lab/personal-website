import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useMemo } from 'react';
/**
 * Displays game statistics: total rolls, win/loss ratio, current streak.
 * Uses useMemo for the ratio calculation to avoid unnecessary re-renders.
 */
const StatsTable = ({ totalRolls, wins, losses, currentStreak, streakType, }) => {
    const winLossRatio = useMemo(() => {
        if (losses === 0 && wins === 0)
            return '—';
        if (losses === 0)
            return `${wins}:0`;
        return `${wins}:${losses}`;
    }, [wins, losses]);
    const winRate = useMemo(() => {
        const total = wins + losses;
        if (total === 0)
            return '—';
        return `${((wins / total) * 100).toFixed(1)}%`;
    }, [wins, losses]);
    const streakDisplay = useMemo(() => {
        if (currentStreak === 0)
            return '—';
        const prefix = streakType === 'win' ? 'W' : 'L';
        return `${prefix}${currentStreak}`;
    }, [currentStreak, streakType]);
    return (_jsxs("div", { className: "stats-card", children: [_jsx("h3", { children: "Statistics" }), _jsxs("div", { className: "stats-row", children: [_jsx("span", { className: "stats-label", children: "Total Rolls" }), _jsx("span", { className: "stats-value", children: totalRolls })] }), _jsxs("div", { className: "stats-row", children: [_jsx("span", { className: "stats-label", children: "Win / Loss" }), _jsx("span", { className: "stats-value", children: winLossRatio })] }), _jsxs("div", { className: "stats-row", children: [_jsx("span", { className: "stats-label", children: "Win Rate" }), _jsx("span", { className: "stats-value", children: winRate })] }), _jsxs("div", { className: "stats-row", children: [_jsx("span", { className: "stats-label", children: "Streak" }), _jsx("span", { className: "stats-value", style: {
                            color: streakType === 'win'
                                ? 'var(--color-green)'
                                : streakType === 'loss'
                                    ? 'var(--color-red)'
                                    : undefined
                        }, children: streakDisplay })] })] }));
};
export default StatsTable;
