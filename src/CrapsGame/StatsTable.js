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
                        }, children: streakDisplay })] }), _jsxs("div", { style: { marginTop: 'var(--gap-xl)', borderTop: '1px solid var(--border-color)', paddingTop: 'var(--gap-md)' }, children: [_jsx("h3", { style: { fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: 'var(--gap-md)' }, children: "Community Contributors" }), _jsxs("div", { style: { display: 'flex', gap: 'var(--gap-sm)', justifyContent: 'center' }, children: [_jsxs("div", { style: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }, children: [_jsx("img", { src: "/crapsgame/images/julian-paefgen-uxU_jyu9e7U-unsplash.jpg", alt: "Julian", style: { width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' } }), _jsx("span", { style: { fontSize: '0.65rem', color: 'var(--text-muted)' }, children: "Julian" })] }), _jsxs("div", { style: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }, children: [_jsx("img", { src: "/crapsgame/images/nick-chong-N__BnvQ_w18-unsplash.jpg", alt: "Nick", style: { width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' } }), _jsx("span", { style: { fontSize: '0.65rem', color: 'var(--text-muted)' }, children: "Nick" })] }), _jsxs("div", { style: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }, children: [_jsx("img", { src: "/crapsgame/images/robb-miller-FTjDQ1-KkU0-unsplash.jpg", alt: "Robb", style: { width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' } }), _jsx("span", { style: { fontSize: '0.65rem', color: 'var(--text-muted)' }, children: "Robb" })] })] })] })] }));
};
export default StatsTable;
