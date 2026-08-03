import { jsx as _jsx } from "react/jsx-runtime";
function WordCloud({ words }) {
    const max = Math.max(...words.map(({ frequency }) => frequency), 1);
    const min = Math.min(...words.map(({ frequency }) => frequency), max);
    return (_jsx("div", { className: "word-cloud", role: "list", "aria-label": "Employee keyword themes", children: words.map(({ word, frequency }) => {
            const ratio = max === min ? 1 : (frequency - min) / (max - min);
            return _jsx("span", { role: "listitem", style: { fontSize: `${.75 + ratio * .85}rem`, opacity: .58 + ratio * .42 }, children: word }, word);
        }) }));
}
export default WordCloud;
