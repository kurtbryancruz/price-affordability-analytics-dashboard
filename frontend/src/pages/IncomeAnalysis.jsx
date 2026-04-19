import { useMemo } from 'react'
import {
  BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts'
import { useAppData } from '../context/AppDataContext'
import PageLayout from '../components/PageLayout'
import KpiCard from '../components/KpiCard'
import ChartCard from '../components/ChartCard'
import RightPanel from '../components/RightPanel'

const incomeAxis = (v) => `₱${Number(v).toFixed(0)}k`
const incomeLabel = (v) => `₱${Number(v).toFixed(2)}k`

export default function IncomeAnalysis() {
  const {
    incomeByRegion, incomeTrend,
    filteredIncomeByRegion,
    regionOptions,
    selectedRegion, setSelectedRegion,
    GRID, AXIS, TOOLTIP,
  } = useAppData()

  const incomeKpis = useMemo(() => {
    if (!incomeByRegion.length) return { avg: '—', highest: '—', highestVal: '—', lowest: '—', lowestVal: '—' }
    const sorted = [...incomeByRegion].sort((a, b) => Number(b.avg_income) - Number(a.avg_income))
    const avg = incomeByRegion.reduce((s, r) => s + Number(r.avg_income), 0) / incomeByRegion.length
    return {
      avg:        incomeLabel(avg),
      highest:    sorted[0].region,
      highestVal: incomeLabel(sorted[0].avg_income),
      lowest:     sorted[sorted.length - 1].region,
      lowestVal:  incomeLabel(sorted[sorted.length - 1].avg_income),
    }
  }, [incomeByRegion])

  const incomeTrendKpi = useMemo(() => {
    if (incomeTrend.length < 2) return '—'
    const first = Number(incomeTrend[0].avg_income)
    const last  = Number(incomeTrend[incomeTrend.length - 1].avg_income)
    const pct   = ((last - first) / first) * 100
    return `${pct >= 0 ? '+' : ''}${pct.toFixed(1)}%`
  }, [incomeTrend])

  return (
    <PageLayout
      breadcrumb="Income Analysis"
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
        <KpiCard label="Avg Regional Income"   value={incomeKpis.avg}        icon="₱" accentClass="accent-blue"  />
        <KpiCard label="Highest Income Region" value={incomeKpis.highest}    sub={incomeKpis.highestVal} icon="↑" accentClass="accent-green" />
        <KpiCard label="Lowest Income Region"  value={incomeKpis.lowest}     sub={incomeKpis.lowestVal}  icon="↓" accentClass="accent-red"   />
        <KpiCard label="Income Change"         value={incomeTrendKpi}        icon="~" accentClass="accent-amber" />
      </section>

      <ChartCard title="Income Trend Over Time" subtitle="All regions · avg income in ₱ thousands" fullWidth>
        <ResponsiveContainer width="100%" height={290}>
          <LineChart data={incomeTrend} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={GRID} />
            <XAxis dataKey="year" tick={{ fill: AXIS, fontSize: 12 }} axisLine={false} tickLine={false} />
            <YAxis tickFormatter={incomeAxis} tick={{ fill: AXIS, fontSize: 12 }} width={64} axisLine={false} tickLine={false} />
            <Tooltip formatter={(v) => [incomeLabel(v), 'Avg Income']} contentStyle={TOOLTIP} />
            <Legend wrapperStyle={{ color: AXIS, fontSize: 12 }} />
            <Line
              type="monotone" dataKey="avg_income" name="Avg Income"
              stroke="#10b981" strokeWidth={2.5}
              dot={{ r: 3.5, fill: '#10b981', strokeWidth: 0 }}
              activeDot={{ r: 5, fill: '#10b981', strokeWidth: 2 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard
        title="Avg Income by Region"
        subtitle={selectedRegion !== 'All' ? selectedRegion : 'All regions · ₱ thousands'}
      >
        {(() => {
          const chartH = Math.max(200, filteredIncomeByRegion.length * 34 + 56)
          return (
            <ResponsiveContainer width="100%" height={chartH}>
              <BarChart layout="vertical" data={filteredIncomeByRegion} margin={{ top: 4, right: 20, left: 0, bottom: 4 }} barSize={18}>
                <CartesianGrid strokeDasharray="3 3" stroke={GRID} horizontal={false} />
                <XAxis type="number" tickFormatter={incomeAxis} tick={{ fill: AXIS, fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="region" tick={{ fill: AXIS, fontSize: 11 }} width={112} axisLine={false} tickLine={false} />
                <Tooltip formatter={(v) => [incomeLabel(v), 'Avg Income']} contentStyle={TOOLTIP} />
                <Bar dataKey="avg_income" name="Avg Income" fill="#10b981" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )
        })()}
      </ChartCard>
    </PageLayout>
  )
}
