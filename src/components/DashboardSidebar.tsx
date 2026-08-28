import React from 'react'

export type ActiveView = 'graph' | 'info'

interface DashboardSidebarProps {
  activeView: ActiveView
  onViewChange: (view: ActiveView) => void
  watchlist: React.ReactNode
}

const DashboardSidebar: React.FC<DashboardSidebarProps> = ({
  activeView,
  onViewChange,
  watchlist,
}) => {
  return (
    <aside className="glass-sidebar" aria-label="Dashboard views">
      <div className="sidebar-nav">
        <button
          type="button"
          className={`sidebar-nav-btn ${activeView === 'graph' ? 'active' : ''}`}
          onClick={() => onViewChange('graph')}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
          </svg>
          <span>Graph View</span>
        </button>
        <button
          type="button"
          className={`sidebar-nav-btn ${activeView === 'info' ? 'active' : ''}`}
          onClick={() => onViewChange('info')}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <span>Company Info</span>
        </button>
      </div>
      <div className="sidebar-divider" />
      <div className="sidebar-watchlist-section">
        <p className="eyebrow">WATCHLIST</p>
        {watchlist}
      </div>
    </aside>
  )
}

export default DashboardSidebar
