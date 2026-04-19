import {
  BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts'
import { useAppData, peso, pesoAxis } from '../context/AppDataContext'
import PageLayout from '../components/PageLayout'
import KpiCard from '../components/KpiCard'
import ChartCard from '../components/ChartCard'
import RightPanel from '../components/RightPanel'

export default function Affordability() {
  const {
    affordability, filteredAffordability,
    regionOptions,
    selectedRegion, setSelectedRegion,
    GRID, AXIS, TOOLTIP,
  } = useAppData()

  const mostAfford   = affordability[affordability.length - 1]
  const leastAfford  = affordability[0]
  const avgIndex     = affordability.length
    ? (affordability.reduce((s, r) => s + Number(r.affordability_index), 0) / affordability.length).toFixed(4)
    : '—'

  return (
    <PageLayout
      breadcrumb="Affordability"
      rightPanel={
        <RightPanel
          regions={regionOptions}
          years={[]}
          selectedRegion={selectedRegion}
          selectedYear="All"
          onRegionChange={setSelectedRegion}
          onYearChange={() => {}}
          insights={[]}
          showYearFilter={false}
          showInsights={false}
        />
      }
    >
      <section className="kpi-row">
        <KpiCard label="Most Affordable"       value={mostAfford?.region ?? '—'}  sub={mostAfford  ? `Index: ${Number(mostAfford.affordability_index).toFixed(4)}`  : ''} icon="★" accentClass="accent-green" />
        <KpiCard label="Least Affordable"      value={leastAfford?.region ?? '—'} sub={leastAfford ? `Index: ${Number(leastAfford.affordability_index).toFixed(4)}` : ''} icon="!" accentClass="accent-red"   />
        <KpiCard label="Avg Affordability Idx" value={avgIndex}                                                                                                           icon="~" accentClass="accent-blue"  />
        <KpiCard label="Regions Compared"      value={affordability.length}                                                                                               icon="#" accentClass="accent-amber" />
      </section>

      <ChartCard
        title="Affordability by Region"
        subtitle={selectedRegion !== 'All' ? selectedRegion : 'All regions'}
        fullWidth
      >
        {(() => {
          const chartH = Math.max(200, filteredAffordability.length * 38 + 90)
          return (
            <ResponsiveContainer width="100%" height={chartH}>
              <BarChart layout="vertical" data={filteredAffordability} margin={{ top: 24, right: 20, left: 0, bottom: 4 }} barSize={9}>
                <CartesianGrid strokeDasharray="3 3" stroke={GRID} horizontal={false} />
                <XAxis xAxisId="price" type="number" orientation="bottom" tickFormatter={pesoAxis}             tick={{ fill: AXIS, fontSize: 11 }} axisLine={false} tickLine={false} />
                <XAxis xAxisId="index" type="number" orientation="top"    tickFormatter={(v) => v.toFixed(3)}  tick={{ fill: AXIS, fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="region" tick={{ fill: AXIS, fontSize: 11 }} width={112} axisLine={false} tickLine={false} />
                <Tooltip formatter={(v, name) => [name === 'Avg Price' ? peso(v) : Number(v).toFixed(4), name]} contentStyle={TOOLTIP} />
                <Legend verticalAlign="bottom" wrapperStyle={{ color: AXIS, fontSize: 12, paddingTop: 12 }} />
                <Bar xAxisId="price" dataKey="avg_price"           name="Avg Price"           fill="#10b981" radius={[0, 4, 4, 0]} />
                <Bar xAxisId="index" dataKey="affordability_index" name="Affordability Index" fill="#f59e0b" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )
        })()}
      </ChartCard>

      <div className="explanation-card">
        <h3 className="explanation-title">How the Affordability Index Works</h3>
        <div className="explanation-body">
          <div className="explanation-item">
            <span className="expl-label">Formula</span>
            <span className="expl-value">Affordability Index = Avg Food Price ÷ Avg Income (₱ thousands)</span>
          </div>
          <div className="explanation-item">
            <span className="expl-label">Interpretation</span>
            <span className="expl-value">A lower index means food is cheaper relative to income — more affordable. A higher index means food consumes a greater share of income.</span>
          </div>
          <div className="explanation-item">
            <span className="expl-label">Example</span>
            <span className="expl-value">Index of 0.03 means avg food price is 3% of the average monthly income in that region.</span>
          </div>
          <div className="explanation-item">
            <span className="expl-label">Data Source</span>
            <span className="expl-value">Computed from <code>food_prices</code> joined with <code>regional_income</code> by region and year.</span>
          </div>
        </div>
      </div>
    </PageLayout>
  )
}
