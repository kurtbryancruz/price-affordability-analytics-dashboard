export default function KpiCard({ label, value, sub, accentClass, icon }) {
  return (
    <div className={`kpi-card ${accentClass ?? ''}`}>
      <div className="kpi-top">
        <span className="kpi-label">{label}</span>
        {icon && <span className="kpi-icon">{icon}</span>}
      </div>
      <span className="kpi-value">{value}</span>
      {sub && <span className="kpi-sub">{sub}</span>}
    </div>
  )
}
