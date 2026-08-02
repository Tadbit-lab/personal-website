import { jsx as _jsx } from "react/jsx-runtime";
import { useEffect, useRef, useState } from 'react';
function drawDoughnut(canvas, positive, neutral, negative) {
    const ctx = canvas.getContext('2d');
    if (!ctx)
        return;
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);
    const W = rect.width;
    const H = rect.height;
    const cx = W / 2;
    const cy = H * 0.48;
    const outerR = Math.min(W, H * 0.9) * 0.38;
    const innerR = outerR * 0.6;
    const total = positive + neutral + negative || 1;
    ctx.clearRect(0, 0, W, H);
    const segments = [
        { value: positive, color: '#22c55e', label: 'Positive' },
        { value: neutral, color: '#eab308', label: 'Neutral' },
        { value: negative, color: '#ef4444', label: 'Negative' },
    ];
    let startAngle = -Math.PI / 2;
    segments.forEach(seg => {
        const sweep = (seg.value / total) * 2 * Math.PI;
        if (sweep < 0.001) {
            startAngle += sweep;
            return;
        }
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.arc(cx, cy, outerR, startAngle, startAngle + sweep);
        ctx.arc(cx, cy, innerR, startAngle + sweep, startAngle, true);
        ctx.closePath();
        ctx.fillStyle = seg.color;
        ctx.fill();
        startAngle += sweep;
    });
    // Legend
    const legendY = cy + outerR + 14;
    const legendSpacing = W / 3;
    ctx.font = `10px Inter, sans-serif`;
    ctx.textAlign = 'center';
    segments.forEach((seg, i) => {
        const x = legendSpacing * i + legendSpacing / 2;
        ctx.fillStyle = seg.color;
        ctx.fillRect(x - 18, legendY, 10, 10);
        ctx.fillStyle = '#888888';
        ctx.fillText(seg.label, x + 6, legendY + 9);
    });
}
const NewsSentimentDoughnut = ({ stockAnalysisJson }) => {
    const canvasRef = useRef(null);
    const containerRef = useRef(null);
    const [positive, setPositive] = useState(0);
    const [neutral, setNeutral] = useState(0);
    const [negative, setNegative] = useState(0);
    useEffect(() => {
        const data = stockAnalysisJson?.newsTextAnalysis?.data;
        if (data) {
            setPositive(data.sentiment?.positive || 0);
            setNeutral(data.sentiment?.neutral || 0);
            setNegative(data.sentiment?.negative || 0);
        }
    }, [stockAnalysisJson]);
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas)
            return;
        drawDoughnut(canvas, positive, neutral, negative);
    }, [positive, neutral, negative]);
    useEffect(() => {
        const container = containerRef.current;
        const canvas = canvasRef.current;
        if (!container || !canvas)
            return;
        const ro = new ResizeObserver(() => drawDoughnut(canvas, positive, neutral, negative));
        ro.observe(container);
        return () => ro.disconnect();
    }, [positive, neutral, negative]);
    return (_jsx("div", { ref: containerRef, style: { width: '100%', height: '180px' }, children: _jsx("canvas", { ref: canvasRef, style: { width: '100%', height: '100%', display: 'block' } }) }));
};
export default NewsSentimentDoughnut;
