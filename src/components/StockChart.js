import { jsx as _jsx } from "react/jsx-runtime";
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Filler } from 'chart.js';
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Filler);
function StockChart({ values, labels, positive }) {
    const color = positive ? '#63d6ad' : '#e77676';
    const data = {
        labels,
        datasets: [{
                data: values,
                borderColor: color,
                backgroundColor: positive ? 'rgba(99, 214, 173, .08)' : 'rgba(231, 118, 118, .08)',
                borderWidth: 2,
                pointRadius: 0,
                pointHoverRadius: 4,
                fill: true,
                tension: .35,
            }],
    };
    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false },
            tooltip: { displayColors: false, backgroundColor: '#171c1c', titleColor: '#f2f0e9', bodyColor: '#a4afaa', borderColor: '#36403d', borderWidth: 1 },
        },
        scales: {
            x: { grid: { color: 'rgba(130, 150, 143, .09)' }, ticks: { color: '#71807a', maxTicksLimit: 6 } },
            y: { grid: { color: 'rgba(130, 150, 143, .09)' }, ticks: { color: '#71807a', callback: (value) => `$${value}` } },
        },
    };
    return _jsx("div", { className: "chart-wrap", children: _jsx(Line, { data: data, options: options }) });
}
export default StockChart;
