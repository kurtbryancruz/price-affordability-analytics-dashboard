export default function ChartCard({ title, subtitle, children, fullWidth }) {
  return (
    <div className={`chart-card${fullWidth ? ' full-width' : ''}`}>
      <div className="chart-card-header">
        <h3 className="chart-title">{title}</h3>
        {subtitle && <span className="chart-subtitle">{subtitle}</span>}
      </div>
      {children}
    </div>
  )
}
