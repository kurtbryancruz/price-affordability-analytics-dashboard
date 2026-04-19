import { useState, useEffect, useMemo } from 'react'
import {
  BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts'
import Sidebar from './components/Sidebar'
import KpiCard from './components/KpiCard'
import ChartCard from './components/ChartCard'
import RightPanel from './components/RightPanel'
import './App.css'

const API_BASE = "http://localhost:3001/api"

const peso = (v) => `₱${Number(v).toFixed(2)}`
const pesoAxis = (v) => `₱${Number(v).toFixed(0)}`


function useTheme() {
  const [dark, setDark] = useState(() => localStorage.getItem('theme') === 'dark')

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light')
    localStorage.setItem('theme', dark ? 'dark' : 'light')
  }, [dark])

  return [dark, () => setDark((d) => !d)]
}

function App() {
  const [dark, toggleDark] = useTheme()

  const [kpis, setKpis] = useState(null)
  const [priceByRegion, setPriceByRegion] = useState([])
  const [priceTrend, setPriceTrend] = useState([])
  const [affordability, setAffordability] = useState([])
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)
  const [selectedRegion, setSelectedRegion] = useState('All')
  const [selectedYear, setSelectedYear] = useState('All')

  /* Theme-aware chart tokens — Recharts needs inline values, not CSS vars */
  const GRID    = dark ? 'rgba(255,255,255,0.05)' : 'rgba(15,23,42,0.05)'
  const AXIS    = dark ? '#475569'                : '#94a3b8'
  const TOOLTIP = dark
    ? { background: '#161b27', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, fontSize: 12, color: '#e2e8f0', boxShadow: '0 8px 24px rgba(0,0,0,0.5)' }
    : { background: '#ffffff', border: 'none',                             borderRadius: 10, fontSize: 12, color: '#0f172a', boxShadow: '0 8px 24px rgba(15,23,42,0.10)' }

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [kpisRes, regionRes, trendRes, affordRes] = await Promise.all([
          fetch(`${API_BASE}/kpis`),
          fetch(`${API_BASE}/price-by-region`),
          fetch(`${API_BASE}/price-trend`),
          fetch(`${API_BASE}/affordability-by-region`),
        ])

        if (!kpisRes.ok || !regionRes.ok || !trendRes.ok || !affordRes.ok) {
          throw new Error("One or more API requests failed")
        }

        const [kpisData, regionData, trendData, affordData] = await Promise.all([
          kpisRes.json(),
          regionRes.json(),
          trendRes.json(),
          affordRes.json(),
        ])

        setKpis(kpisData)
        setPriceByRegion(regionData)
        setPriceTrend(trendData)
        setAffordability(affordData)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchAll()
  }, [])

  const regionOptions = useMemo(() => ['All', ...priceByRegion.map((r) => r.region)], [priceByRegion])
  const yearOptions   = useMemo(() => ['All', ...priceTrend.map((t) => String(t.year))], [priceTrend])

  const filteredPriceByRegion = useMemo(() =>
    selectedRegion === 'All' ? priceByRegion : priceByRegion.filter((r) => r.region === selectedRegion),
    [priceByRegion, selectedRegion]
  )
  const filteredAffordability = useMemo(() =>
    selectedRegion === 'All' ? affordability : affordability.filter((r) => r.region === selectedRegion),
    [affordability, selectedRegion]
  )
  const filteredPriceTrend = useMemo(() =>
    selectedYear === 'All' ? priceTrend : priceTrend.filter((t) => String(t.year) === selectedYear),
    [priceTrend, selectedYear]
  )

  const insights = useMemo(() => {
    if (!priceByRegion.length || !priceTrend.length || !affordability.length) return []
    const highest = priceByRegion[0]
    const lowest  = priceByRegion[priceByRegion.length - 1]
    const mostAffordable = affordability[affordability.length - 1]
    const trendUp = priceTrend.length >= 2
      && Number(priceTrend[priceTrend.length - 1].avg_price) > Number(priceTrend[0].avg_price)

    return [
      { label: 'Highest Priced Region', value: `${highest.region} — ${peso(highest.avg_price)}`,        type: 'danger'  },
      { label: 'Lowest Priced Region',  value: `${lowest.region} — ${peso(lowest.avg_price)}`,          type: 'success' },
      { label: 'Most Affordable',       value: mostAffordable?.region ?? '—',                           type: 'info'    },
      { label: 'Price Trend',           value: trendUp ? 'Rising over time' : 'Declining over time',    type: trendUp ? 'danger' : 'success' },
    ]
  }, [priceByRegion, priceTrend, affordability])

  const derivedKpis = useMemo(() => ({
    topRegion:       priceByRegion[0]?.region ?? '—',
    topRegionPrice:  priceByRegion[0] ? peso(priceByRegion[0].avg_price) : '—',
    mostAffordable:  affordability[affordability.length - 1]?.region ?? '—',
  }), [priceByRegion, affordability])

  if (loading) return <div className="full-screen-status">Loading dashboard…</div>
  if (error)   return <div className="full-screen-status error">{error}</div>

  return (
    <div className="app-shell">
      <Sidebar />

      <div className="main-area">
        <header className="top-bar">
          <div className="top-bar-left">
            <span className="breadcrumb-muted">Dashboards</span>
            <span className="breadcrumb-sep">/</span>
            <span className="breadcrumb-active">Overview</span>
          </div>
          <div className="top-bar-right">
            <span className="date-badge">Today</span>
            <button className="theme-toggle" onClick={toggleDark} aria-label="Toggle theme" title={dark ? 'Switch to light mode' : 'Switch to dark mode'}>
              {dark ? '☀' : '☾'}
            </button>
          </div>
        </header>

        <div className="content-area">
          <div className="content-main">
            {/* KPI row */}
            <section className="kpi-row">
              <KpiCard label="Total Records"     value={Number(kpis?.total_records).toLocaleString()}            icon="#" accentClass="accent-blue"  />
              <KpiCard label="Avg Food Price"    value={`₱${Number(kpis?.avg_price).toFixed(2)}`}            icon="₱" accentClass="accent-green" />
              <KpiCard label="Highest Price"     value={derivedKpis.topRegion} sub={derivedKpis.topRegionPrice} icon="↑" accentClass="accent-red"   />
              <KpiCard label="Most Affordable"   value={derivedKpis.mostAffordable}                            icon="★" accentClass="accent-amber" />
            </section>

            {/* Price trend — dominant center chart */}
            <ChartCard
              title="Price Trend Over Time"
              subtitle={selectedYear !== 'All' ? `Year: ${selectedYear}` : 'All years'}
              fullWidth
            >
              <ResponsiveContainer width="100%" height={290}>
                <LineChart data={filteredPriceTrend} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={GRID} />
                  <XAxis dataKey="year" tick={{ fill: AXIS, fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis tickFormatter={pesoAxis} tick={{ fill: AXIS, fontSize: 12 }} width={60} axisLine={false} tickLine={false} />
                  <Tooltip formatter={(v) => [peso(v), 'Avg Price']} contentStyle={TOOLTIP} />
                  <Legend wrapperStyle={{ color: AXIS, fontSize: 12 }} />
                  <Line
                    type="monotone"
                    dataKey="avg_price"
                    name="Avg Price"
                    stroke="#4361ee"
                    strokeWidth={2.5}
                    dot={{ r: 3.5, fill: '#4361ee', strokeWidth: 0 }}
                    activeDot={{ r: 5, fill: '#4361ee', stroke: dark ? '#19202e' : '#fff', strokeWidth: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </ChartCard>

            {/* Bottom row */}
            <div className="bottom-row">
              {/*
                Height is computed from data length so every region gets a
                full-sized row regardless of how many regions are returned.
                BAR_ROW = px allocated per region row (bar + padding).
              */}
              <ChartCard
                title="Price by Region"
                subtitle={selectedRegion !== 'All' ? selectedRegion : 'All regions'}
              >
                {(() => {
                  const BAR_ROW = 34        // px per region: bar (18) + gap (16)
                  const OVERHEAD = 56       // x-axis + top/bottom margins
                  const chartH = Math.max(200, filteredPriceByRegion.length * BAR_ROW + OVERHEAD)
                  return (
                    <ResponsiveContainer width="100%" height={chartH}>
                      <BarChart
                        layout="vertical"
                        data={filteredPriceByRegion}
                        margin={{ top: 4, right: 20, left: 0, bottom: 4 }}
                        barSize={18}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke={GRID} horizontal={false} />
                        <XAxis
                          type="number"
                          tickFormatter={pesoAxis}
                          tick={{ fill: AXIS, fontSize: 11 }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <YAxis
                          type="category"
                          dataKey="region"
                          tick={{ fill: AXIS, fontSize: 11 }}
                          width={112}
                          axisLine={false}
                          tickLine={false}
                        />
                        <Tooltip formatter={(v) => [peso(v), 'Avg Price']} contentStyle={TOOLTIP} />
                        <Bar dataKey="avg_price" name="Avg Price" fill="#4361ee" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  )
                })()}
              </ChartCard>

              {/*
                Dual X-axis horizontal bar chart.
                avg_price (₱ hundreds) and affordability_index (0.00x ratio) are
                incompatible scales — each Bar is bound to its own XAxis so both
                series render at a meaningful size.
              */}
              <ChartCard
                title="Affordability by Region"
                subtitle={selectedRegion !== 'All' ? selectedRegion : 'All regions'}
              >
                {(() => {
                  const BAR_ROW = 38        // px per region: 2 bars (9 each) + gaps + padding
                  const OVERHEAD = 90       // top axis + bottom axis + legend + margins
                  const chartH = Math.max(200, filteredAffordability.length * BAR_ROW + OVERHEAD)
                  return (
                    <ResponsiveContainer width="100%" height={chartH}>
                      <BarChart
                        layout="vertical"
                        data={filteredAffordability}
                        margin={{ top: 24, right: 20, left: 0, bottom: 4 }}
                        barSize={9}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke={GRID} horizontal={false} />

                        {/* Bottom axis — price scale (₱) */}
                        <XAxis
                          xAxisId="price"
                          type="number"
                          orientation="bottom"
                          tickFormatter={pesoAxis}
                          tick={{ fill: AXIS, fontSize: 11 }}
                          axisLine={false}
                          tickLine={false}
                        />
                        {/* Top axis — affordability index scale (ratio) */}
                        <XAxis
                          xAxisId="index"
                          type="number"
                          orientation="top"
                          tickFormatter={(v) => v.toFixed(3)}
                          tick={{ fill: AXIS, fontSize: 10 }}
                          axisLine={false}
                          tickLine={false}
                        />

                        <YAxis
                          type="category"
                          dataKey="region"
                          tick={{ fill: AXIS, fontSize: 11 }}
                          width={112}
                          axisLine={false}
                          tickLine={false}
                        />
                        <Tooltip
                          formatter={(v, name) => [
                            name === 'Avg Price' ? peso(v) : Number(v).toFixed(4),
                            name,
                          ]}
                          contentStyle={TOOLTIP}
                        />
                        <Legend
                          verticalAlign="bottom"
                          wrapperStyle={{ color: AXIS, fontSize: 12, paddingTop: 12 }}
                        />
                        <Bar xAxisId="price" dataKey="avg_price"          name="Avg Price"           fill="#10b981" radius={[0, 4, 4, 0]} />
                        <Bar xAxisId="index" dataKey="affordability_index" name="Affordability Index" fill="#f59e0b" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  )
                })()}
              </ChartCard>
            </div>
          </div>

          <RightPanel
            regions={regionOptions}
            years={yearOptions}
            selectedRegion={selectedRegion}
            selectedYear={selectedYear}
            onRegionChange={setSelectedRegion}
            onYearChange={setSelectedYear}
            insights={insights}
          />
        </div>
      </div>
    </div>
  )
}

export default App
