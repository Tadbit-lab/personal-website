import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { VerticalAlignContainer, VerticalAlignContent, } from './StockAnalysisDashboard';
import Styled from 'styled-components';
import { PrimaryColor } from './StockAnalysisDashboard';
import numabbr from 'numabbr';
const NumberDisplay = Styled.div `
color: ${PrimaryColor};
font-size: 20px;
`;
const LabelStyle = Styled.div `
font-size: 12px;
`;
function NumberStat({ value, label, center }) {
    return (_jsx(VerticalAlignContainer, { style: { textAlign: center ? 'center' : 'left' }, children: _jsxs(VerticalAlignContent, { children: [_jsx(NumberDisplay, { children: numabbr(value) }), _jsx(LabelStyle, { children: label })] }) }));
}
export default NumberStat;
