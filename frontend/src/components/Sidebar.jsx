import { NavLink } from 'react-router-dom'

const NAV_GROUPS = [
  {
    label: 'Dashboards',
    items: [
      { label: 'Overview',          path: '/overview'      },
      { label: 'Income Analysis',   path: '/income'        },
      { label: 'Regional Analysis', path: '/regional'      },
      { label: 'Affordability',     path: '/affordability' },
    ],
  },
  {
    label: 'Reports',
    items: [
      { label: 'Reports', path: '/reports' },
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
        <span className="brand-name">AffordaScope</span>
      </div>

      <nav className="sidebar-nav">
        {NAV_GROUPS.map((group) => (
          <div key={group.label} className="nav-group">
            <span className="nav-group-label">{group.label}</span>
            {group.items.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
              >
                <span className="nav-icon" aria-hidden="true" />
                {item.label}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      <div className="sidebar-footer team-footer">
        <p className="team-label">Pampamilyang IT</p>
        <ul className="team-list">
          <li>Cruz, Kurt Bryan</li>
          <li>Dialogo, Fritz Gerald</li>
          <li>Dimal, Lancer Johndrix</li>
          <li>Mayagma, Guillmar</li>
          <li>Nilo, Harry</li>
          <li>Paghunasan, Jeroen Gil</li>
        </ul>
      </div>
    </aside>
  )
}
