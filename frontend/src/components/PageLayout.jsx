import { useAppData } from '../context/AppDataContext'

export default function PageLayout({ breadcrumb, children, rightPanel }) {
  const { dark, toggleDark, toggleSidebar } = useAppData()

  return (
    <>
      <header className="top-bar">
        <div className="top-bar-left">
          <button className="hamburger" onClick={toggleSidebar} aria-label="Toggle navigation">
            <span /><span /><span />
          </button>
          <span className="breadcrumb-muted">Dashboards</span>
          <span className="breadcrumb-sep">/</span>
          <span className="breadcrumb-active">{breadcrumb}</span>
        </div>
        <div className="top-bar-right">
          <button
            className="theme-toggle"
            onClick={toggleDark}
            aria-label="Toggle theme"
            title={dark ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {dark ? '☀' : '☾'}
          </button>
        </div>
      </header>

      <div className="content-area">
        <div className="content-main">
          {children}
        </div>
        {rightPanel}
      </div>
    </>
  )
}
