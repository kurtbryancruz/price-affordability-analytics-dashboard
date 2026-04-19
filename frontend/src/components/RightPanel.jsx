export default function RightPanel({
  regions,
  years,
  selectedRegion,
  selectedYear,
  onRegionChange,
  onYearChange,
  insights,
}) {
  return (
    <aside className="right-panel">
      <section className="panel-section">
        <h3 className="panel-title">Filters</h3>

        <label className="filter-label" htmlFor="region-select">Region</label>
        <select
          id="region-select"
          className="filter-select"
          value={selectedRegion}
          onChange={(e) => onRegionChange(e.target.value)}
        >
          {regions.map((r) => (
            <option key={r} value={r}>{r}</option>
          ))}
        </select>

        <label className="filter-label" htmlFor="year-select">Year</label>
        <select
          id="year-select"
          className="filter-select"
          value={selectedYear}
          onChange={(e) => onYearChange(e.target.value)}
        >
          {years.map((y) => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
      </section>

      <section className="panel-section">
        <h3 className="panel-title">Key Insights</h3>
        <div className="insights-list">
          {insights.map((ins) => (
            <div key={ins.label} className="insight-item">
              <span className={`insight-badge ${ins.type}`} />
              <div className="insight-text">
                <p className="insight-label">{ins.label}</p>
                <p className="insight-value">{ins.value}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </aside>
  )
}
