import {
  BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts'
import { useAppData, peso, pesoAxis } from '../context/AppDataContext'
import PageLayout from '../components/PageLayout'
import KpiCard from '../components/KpiCard'
import ChartCard from '../components/ChartCard'
import RightPanel from '../components/RightPanel'

export default function Overview() {
  const {
    kpis, derivedKpis,
    filteredPriceByRegion, filteredAffordability, filteredPriceTrend,
    regionOptions, yearOptions,
    selectedRegion, setSelectedRegion,
    selectedYear, setSelectedYear,
    insights,
    dark, GRID, AXIS, TOOLTIP,
  } = useAppData()

  return (
    <PageLayout
      breadcrumb="Overview"
      rightPanel={
        <RightPanel
          regions={regionOptions}
          years={yearOptions}
          selectedRegion={selectedRegion}
          selectedYear={selectedYear}
          onRegionChange={setSelectedRegion}
          onYearChange={setSelectedYear}
          insights={insights}
        />
      }
    >
      <section className="kpi-row">
        <KpiCard label="Total Records"   value={Number(kpis?.total_records).toLocaleString()}  icon="#" accentClass="accent-blue"  />
        <KpiCard label="Avg Food Price"  value={`₱${Number(kpis?.avg_price).toFixed(2)}`}      icon="₱" accentClass="accent-green" />
        <KpiCard label="Highest Price"   value={derivedKpis.topRegion} sub={derivedKpis.topRegionPrice} icon="↑" accentClass="accent-red" />
        <KpiCard label="Most Affordable" value={derivedKpis.mostAffordable}                    icon="★" accentClass="accent-amber" />
      </section>

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
              type="monotone" dataKey="avg_price" name="Avg Price"
              stroke="#4361ee" strokeWidth={2.5}
              dot={{ r: 3.5, fill: '#4361ee', strokeWidth: 0 }}
              activeDot={{ r: 5, fill: '#4361ee', stroke: dark ? '#19202e' : '#fff', strokeWidth: 2 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>

      <div className="bottom-row">
        <ChartCard
          title="Price by Region"
          subtitle={selectedRegion !== 'All' ? selectedRegion : 'All regions'}
        >
          {(() => {
            const chartH = Math.max(200, filteredPriceByRegion.length * 34 + 56)
            return (
              <ResponsiveContainer width="100%" height={chartH}>
                <BarChart layout="vertical" data={filteredPriceByRegion} margin={{ top: 4, right: 20, left: 0, bottom: 4 }} barSize={18}>
                  <CartesianGrid strokeDasharray="3 3" stroke={GRID} horizontal={false} />
                  <XAxis type="number" tickFormatter={pesoAxis} tick={{ fill: AXIS, fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="region" tick={{ fill: AXIS, fontSize: 11 }} width={112} axisLine={false} tickLine={false} />
                  <Tooltip formatter={(v) => [peso(v), 'Avg Price']} contentStyle={TOOLTIP} />
                  <Bar dataKey="avg_price" name="Avg Price" fill="#4361ee" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )
          })()}
        </ChartCard>

        <ChartCard
          title="Affordability by Region"
          subtitle={selectedRegion !== 'All' ? selectedRegion : 'All regions'}
        >
          {(() => {
            const chartH = Math.max(200, filteredAffordability.length * 38 + 90)
            return (
              <ResponsiveContainer width="100%" height={chartH}>
                <BarChart layout="vertical" data={filteredAffordability} margin={{ top: 24, right: 20, left: 0, bottom: 4 }} barSize={9}>
                  <CartesianGrid strokeDasharray="3 3" stroke={GRID} horizontal={false} />
                  <XAxis xAxisId="price" type="number" orientation="bottom" tickFormatter={pesoAxis} tick={{ fill: AXIS, fontSize: 11 }} axisLine={false} tickLine={false} />
                  <XAxis xAxisId="index" type="number" orientation="top"    tickFormatter={(v) => v.toFixed(3)} tick={{ fill: AXIS, fontSize: 10 }} axisLine={false} tickLine={false} />
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
      </div>
    </PageLayout>
  )
}
