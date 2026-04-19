import { useMemo } from 'react'
import {
  BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'
import { useAppData, peso, pesoAxis } from '../context/AppDataContext'
import PageLayout from '../components/PageLayout'
import KpiCard from '../components/KpiCard'
import ChartCard from '../components/ChartCard'
import RightPanel from '../components/RightPanel'

export default function RegionalAnalysis() {
  const {
    priceByRegion, affordability,
    filteredPriceByRegion,
    regionOptions,
    selectedRegion, setSelectedRegion,
    GRID, AXIS, TOOLTIP,
  } = useAppData()

  /* Merge price + income + affordability per region for the ranking table */
  const rankingData = useMemo(() => {
    return priceByRegion
      .map((pr) => {
        const aff = affordability.find((a) => a.region === pr.region)
        return {
          region:              pr.region,
          avg_price:           Number(pr.avg_price),
          avg_income:          aff ? Number(aff.avg_income_thousands) : null,
          affordability_index: aff ? Number(aff.affordability_index) : null,
        }
      })
      .sort((a, b) => a.region.localeCompare(b.region))
  }, [priceByRegion, affordability])

  const regionKpis = useMemo(() => {
    if (!priceByRegion.length) return { count: 0, spread: '—' }
    const prices = priceByRegion.map((r) => Number(r.avg_price))
    const spread = Math.max(...prices) - Math.min(...prices)
    return {
      count:  priceByRegion.length,
      spread: peso(spread),
    }
  }, [priceByRegion])

  return (
    <PageLayout
      breadcrumb="Regional Analysis"
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
        <KpiCard label="Regions Tracked" value={regionKpis.count}                        icon="#" accentClass="accent-blue"  />
        <KpiCard label="Price Range"     value={regionKpis.spread}                        icon="↔" accentClass="accent-amber" />
        <KpiCard label="Highest Price"   value={priceByRegion[0]?.region ?? '—'}          sub={priceByRegion[0] ? peso(priceByRegion[0].avg_price) : ''} icon="↑" accentClass="accent-red"   />
        <KpiCard label="Lowest Price"    value={priceByRegion[priceByRegion.length - 1]?.region ?? '—'} sub={priceByRegion[priceByRegion.length - 1] ? peso(priceByRegion[priceByRegion.length - 1].avg_price) : ''} icon="↓" accentClass="accent-green" />
      </section>

      <ChartCard
        title="Price by Region"
        subtitle={selectedRegion !== 'All' ? selectedRegion : 'All regions'}
        fullWidth
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

      <ChartCard title="Region Ranking" subtitle="Sorted by region name">
        <div className="ranking-table-wrap">
          <table className="ranking-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Region</th>
                <th>Avg Food Price</th>
                <th>Avg Family Annual Income</th>
                <th>Afford. Index</th>
              </tr>
            </thead>
            <tbody>
              {rankingData.map((row, i) => (
                <tr key={row.region} className={selectedRegion !== 'All' && row.region !== selectedRegion ? 'row-dim' : ''}>
                  <td className="rank-num">{i + 1}</td>
                  <td className="rank-region">{row.region}</td>
                  <td>{peso(row.avg_price)}</td>
                  <td>{row.avg_income != null ? `₱${row.avg_income.toFixed(2)}k` : '—'}</td>
                  <td>
                    {row.affordability_index != null
                      ? <span className={`afford-badge ${row.affordability_index > 0.05 ? 'badge-red' : 'badge-green'}`}>
                          {row.affordability_index.toFixed(4)}
                        </span>
                      : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </ChartCard>
    </PageLayout>
  )
}
