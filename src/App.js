import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import StockDashboard from './StockAnalysisDashboard/StockDashboard';
import CrapsGame from './CrapsGame/CrapsGame';
import './index.css';
function App() {
    const [activeView, setActiveView] = useState('stock');
    return (_jsxs("div", { style: { minHeight: '100vh', display: 'flex', flexDirection: 'column' }, children: [_jsxs("nav", { style: {
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 24px',
                    borderBottom: '1px solid var(--border-color)',
                    backgroundColor: 'var(--bg-secondary)',
                }, children: [_jsx("span", { style: {
                            fontFamily: 'var(--font-heading)',
                            fontWeight: 700,
                            fontSize: '1rem',
                            letterSpacing: '-0.02em',
                            color: 'var(--text-primary)',
                        }, children: "TONILOBA" }), _jsxs("div", { style: { display: 'flex', gap: '4px' }, children: [_jsx("button", { className: activeView === 'stock' ? 'btn btn-primary' : 'btn btn-ghost', onClick: () => setActiveView('stock'), style: { fontSize: '0.75rem', padding: '8px 16px' }, children: "Stock Dashboard" }), _jsx("button", { className: activeView === 'craps' ? 'btn btn-primary' : 'btn btn-ghost', onClick: () => setActiveView('craps'), style: { fontSize: '0.75rem', padding: '8px 16px' }, children: "Craps Simulator" })] })] }), _jsxs("main", { style: { flex: 1 }, children: [activeView === 'stock' && _jsx(StockDashboard, {}), activeView === 'craps' && _jsx(CrapsGame, {})] })] }));
}
export default App;
