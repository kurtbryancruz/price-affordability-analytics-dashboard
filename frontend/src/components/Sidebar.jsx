const NAV_GROUPS = [
  {
    label: 'Dashboards',
    items: [
      { label: 'Overview',          active: true  },
      { label: 'Price Trends',      active: false },
      { label: 'Regional Analysis', active: false },
      { label: 'Affordability',     active: false },
    ],
  },
  {
    label: 'Reports',
    items: [
      { label: 'Annual Summary', active: false },
      { label: 'Export Data',    active: false },
    ],
  },
]

export default function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="brand-logo">
          <span className="brand-dot" />
          <span className="brand-dot" />
          <span className="brand-dot" />
        </div>
        <span className="brand-name">FoodAnalytics</span>
      </div>

      <nav className="sidebar-nav">
        {NAV_GROUPS.map((group) => (
          <div key={group.label} className="nav-group">
            <span className="nav-group-label">{group.label}</span>
            {group.items.map((item) => (
              <a
                key={item.label}
                href="#"
                className={`nav-item${item.active ? ' active' : ''}`}
                onClick={(e) => e.preventDefault()}
              >
                <span className="nav-icon" aria-hidden="true" />
                {item.label}
              </a>
            ))}
          </div>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="user-avatar">K</div>
        <div className="user-info">
          <p className="user-name">Analytics User</p>
          <p className="user-role">Data Analyst</p>
        </div>
      </div>
    </aside>
  )
}
