import { useState } from 'react'
import StockDashboard from './StockAnalysisDashboard/StockDashboard'
import CrapsGame from './CrapsGame/CrapsGame'
import './index.css'

type View = 'stock' | 'craps'

function App() {
  const [activeView, setActiveView] = useState<View>('stock')

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* ===========================
         NAV BAR
      =========================== */}
      <nav style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 24px',
        borderBottom: '1px solid var(--border-color)',
        backgroundColor: 'var(--bg-secondary)',
      }}>
        <span style={{
          fontFamily: 'var(--font-heading)',
          fontWeight: 700,
          fontSize: '1rem',
          letterSpacing: '-0.02em',
          color: 'var(--text-primary)',
        }}>
          TONILOBA
        </span>

        <div style={{ display: 'flex', gap: '4px' }}>
          <button
            className={activeView === 'stock' ? 'btn btn-primary' : 'btn btn-ghost'}
            onClick={() => setActiveView('stock')}
            style={{ fontSize: '0.75rem', padding: '8px 16px' }}
          >
            Stock Dashboard
          </button>
          <button
            className={activeView === 'craps' ? 'btn btn-primary' : 'btn btn-ghost'}
            onClick={() => setActiveView('craps')}
            style={{ fontSize: '0.75rem', padding: '8px 16px' }}
          >
            Craps Simulator
          </button>
        </div>
      </nav>

      {/* ===========================
         MAIN CONTENT
      =========================== */}
      <main style={{ flex: 1 }}>
        {activeView === 'stock' && <StockDashboard />}
        {activeView === 'craps' && <CrapsGame />}
      </main>
    </div>
  )
}

export default App
