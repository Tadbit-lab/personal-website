/* ===========================
   DASHBOARD SIDEBAR
   Glassy vertical nav on desktop, tab bar on mobile.
   =========================== */

export type DashView = 'graph' | 'info'

interface DashboardSidebarProps {
  activeView: DashView
  onViewChange: (v: DashView) => void
  symbol: string
}

const ITEMS: { id: DashView; label: string; icon: string }[] = [
  {
    id: 'graph',
    label: 'Graph',
    icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
    </svg>`,
  },
  {
    id: 'info',
    label: 'Company Info',
    icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <line x1="12" y1="8" x2="12" y2="12"/>
      <line x1="12" y1="16" x2="12.01" y2="16"/>
    </svg>`,
  },
]

function DashboardSidebar({ activeView, onViewChange, symbol }: DashboardSidebarProps) {
  return (
    <>
      {/* ── Desktop sidebar ─────────────────────────────── */}
      <aside className="dash-sidebar" aria-label="Dashboard navigation">
        <div className="dash-sidebar-symbol">{symbol}</div>
        <nav className="dash-sidebar-nav">
          {ITEMS.map((item) => (
            <button
              key={item.id}
              id={`dash-nav-${item.id}`}
              className={`dash-sidebar-nav-item${activeView === item.id ? ' active' : ''}`}
              onClick={() => onViewChange(item.id)}
              aria-current={activeView === item.id ? 'page' : undefined}
            >
              <span
                className="dash-nav-icon"
                dangerouslySetInnerHTML={{ __html: item.icon }}
              />
              <span>{item.label}</span>
            </button>
          ))}
        </nav>
      </aside>

      {/* ── Mobile tab bar ──────────────────────────────── */}
      <div className="dash-mobile-tabs" role="tablist" aria-label="Dashboard views">
        {ITEMS.map((item) => (
          <button
            key={item.id}
            id={`dash-tab-${item.id}`}
            role="tab"
            className={`dash-tab-btn${activeView === item.id ? ' active' : ''}`}
            onClick={() => onViewChange(item.id)}
            aria-selected={activeView === item.id}
          >
            <span
              className="dash-nav-icon"
              dangerouslySetInnerHTML={{ __html: item.icon }}
            />
            <span>{item.label}</span>
          </button>
        ))}
      </div>
    </>
  )
}

export default DashboardSidebar
