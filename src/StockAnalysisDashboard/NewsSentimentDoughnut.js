import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, } from 'chart.js';
import NumberStat from './NumberStat';
import { PrimaryColor } from './StockAnalysisDashboard';
ChartJS.register(ArcElement, Tooltip, Legend);
const NewsSentimentDoughnut = ({ stockAnalysisJson }) => {
    const [positive, setPositive] = useState(0);
    const [neutral, setNeutral] = useState(0);
    const [negative, setNegative] = useState(0);
    const [sentences, setSentences] = useState(0);
    const [words, setWords] = useState(0);
    useEffect(() => {
        const data = stockAnalysisJson?.newsTextAnalysis?.data;
        if (data) {
            setPositive(data.sentiment.positive || 0);
            setNeutral(data.sentiment.neutral || 0);
            setNegative(data.sentiment.negative || 0);
            setSentences(data.sentences || 0);
            setWords(data.words || 0); // if you calculate words in backend, otherwise can compute length of text
        }
    }, [stockAnalysisJson]);
    const doughnutData = {
        labels: ['Positive', 'Neutral', 'Negative'],
        datasets: [
            {
                data: [positive, neutral, negative],
                backgroundColor: ['#22c55e', '#eab308', '#ef4444'], // green, yellow, red
                borderWidth: 0,
            },
        ],
    };
    const options = {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '60%',
        plugins: {
            legend: {
                display: true,
                position: 'top',
                align: 'start', // left-align horizontally
                labels: {
                    boxWidth: 15,
                    boxHeight: 15,
                    padding: 12,
                    font: { size: 12 },
                },
            },
        },
    };
    return (_jsxs("div", { style: { position: 'relative', width: '100%', height: '250px' }, children: [_jsx("div", { style: { width: '180px', height: '180px', margin: '35px 0 0 0' }, children: _jsx(Doughnut, { data: doughnutData, options: options }) }), _jsxs("div", { style: {
                    position: 'absolute',
                    top: '8px',
                    right: '8px',
                    fontSize: '13px',
                    fontWeight: 600,
                    color: PrimaryColor,
                }, children: ["News Analysis", _jsx("div", { style: { paddingTop: '10px', paddingBottom: '10px' }, children: _jsx(NumberStat, { value: sentences, label: "Sentences analysed" }) }), _jsx("div", { style: { paddingBottom: '10px' }, children: _jsx(NumberStat, { value: words, label: "Words analysed" }) })] })] }));
};
export default NewsSentimentDoughnut;
