import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { lazy, Suspense } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import Landing from './pages/Landing';
import './index.css';
const Craps = lazy(() => import('./pages/Craps'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
function PageFallback() {
    return (_jsx("div", { style: { minHeight: '100vh', display: 'grid', placeItems: 'center', background: '#101414', color: '#91a09a', fontFamily: "'DM Mono', monospace", fontSize: 12, letterSpacing: '0.1em' }, children: "LOADING\u2026" }));
}
function App() {
    return (_jsx(BrowserRouter, { basename: import.meta.env.BASE_URL, children: _jsx(Suspense, { fallback: _jsx(PageFallback, {}), children: _jsxs(Routes, { children: [_jsx(Route, { path: "/", element: _jsx(Landing, {}) }), _jsx(Route, { path: "/craps", element: _jsx(Craps, {}) }), _jsx(Route, { path: "/dashboard", element: _jsx(Dashboard, {}) }), _jsx(Route, { path: "*", element: _jsx(Navigate, { to: "/", replace: true }) })] }) }) }));
}
export default App;
