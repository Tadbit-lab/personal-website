import { lazy, Suspense } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import Landing from './pages/Landing'
import './index.css'

const Craps = lazy(() => import('./pages/Craps'))
const Dashboard = lazy(() => import('./pages/Dashboard'))

function PageFallback() {
  return (
    <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: '#101414', color: '#91a09a', fontFamily: "'DM Mono', monospace", fontSize: 12, letterSpacing: '0.1em' }}>
      LOADING…
    </div>
  )
}

function App() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <Suspense fallback={<PageFallback />}>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/craps" element={<Craps />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}

export default App
