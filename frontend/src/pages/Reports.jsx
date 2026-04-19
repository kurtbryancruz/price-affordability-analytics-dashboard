import { useMemo } from 'react'
import { useAppData, peso } from '../context/AppDataContext'
import PageLayout from '../components/PageLayout'
import KpiCard from '../components/KpiCard'
import ChartCard from '../components/ChartCard'

export default function Reports() {
  const { priceByRegion, priceTrend, affordability, incomeByRegion } = useAppData()

  const summary = useMemo(() => {
    if (!priceTrend.length || !priceByRegion.length || !affordability.length) return null

    const firstYear = priceTrend[0]
    const lastYear  = priceTrend[priceTrend.length - 1]
    const priceChange = ((Number(lastYear.avg_price) - Number(firstYear.avg_price)) / Number(firstYear.avg_price)) * 100

    const top5Expensive  = [...priceByRegion].sort((a, b) => Number(b.avg_price) - Number(a.avg_price)).slice(0, 5)
    const top5Affordable    = [...affordability].sort((a, b) => Number(a.affordability_index) - Number(b.affordability_index)).slice(0, 5)
    const top5LeastAfford   = [...affordability].sort((a, b) => Number(b.affordability_index) - Number(a.affordability_index)).slice(0, 5)
    const top5Income        = [...incomeByRegion].sort((a, b) => Number(b.avg_income) - Number(a.avg_income)).slice(0, 5)

    return { firstYear, lastYear, priceChange, top5Expensive, top5Affordable, top5LeastAfford, top5Income }
  }, [priceTrend, priceByRegion, affordability, incomeByRegion])

  if (!summary) return null

  const { firstYear, lastYear, priceChange, top5Expensive, top5Affordable, top5LeastAfford, top5Income } = summary
  const trendUp = priceChange >= 0

  return (
    <PageLayout breadcrumb="Reports">
      <section className="kpi-row">
        <KpiCard
          label={`Price Change (${firstYear.year}–${lastYear.year})`}
          value={`${trendUp ? '+' : ''}${priceChange.toFixed(1)}%`}
          sub={`${peso(firstYear.avg_price)} → ${peso(lastYear.avg_price)}`}
          icon={trendUp ? '↑' : '↓'}
          accentClass={trendUp ? 'accent-red' : 'accent-green'}
        />
        <KpiCard label="Most Expensive Region"  value={top5Expensive[0]?.region ?? '—'}  sub={top5Expensive[0]  ? peso(top5Expensive[0].avg_price) : ''}                                          icon="↑" accentClass="accent-red"   />
        <KpiCard label="Most Affordable Region" value={top5Affordable[0]?.region ?? '—'} sub={top5Affordable[0] ? `Index: ${Number(top5Affordable[0].affordability_index).toFixed(4)}` : ''}       icon="★" accentClass="accent-green" />
        <KpiCard label="Highest Income Region"  value={top5Income[0]?.region ?? '—'}     sub={top5Income[0]     ? `₱${Number(top5Income[0].avg_income).toFixed(2)}k` : ''}                        icon="₱" accentClass="accent-blue"  />
      </section>

      <div className="bottom-row">
        <ChartCard title="Top 5 Most Expensive Regions" subtitle="By avg food price">
          <div className="report-list">
            {top5Expensive.map((r, i) => (
              <div key={r.region} className="report-list-item">
                <span className="report-rank">{i + 1}</span>
                <span className="report-region">{r.region}</span>
                <span className="report-value red">{peso(r.avg_price)}</span>
              </div>
            ))}
          </div>
        </ChartCard>

        <ChartCard title="Top 5 Most Affordable Regions" subtitle="By affordability index (lower = more affordable)">
          <div className="report-list">
            {top5Affordable.map((r, i) => (
              <div key={r.region} className="report-list-item">
                <span className="report-rank">{i + 1}</span>
                <span className="report-region">{r.region}</span>
                <span className="report-value green">{Number(r.affordability_index).toFixed(4)}</span>
              </div>
            ))}
          </div>
        </ChartCard>
      </div>

      <div className="bottom-row">
        <ChartCard title="Top 5 Highest Income Regions" subtitle="Avg income in ₱ thousands">
          <div className="report-list">
            {top5Income.map((r, i) => (
              <div key={r.region} className="report-list-item">
                <span className="report-rank">{i + 1}</span>
                <span className="report-region">{r.region}</span>
                <span className="report-value blue">₱{Number(r.avg_income).toFixed(2)}k</span>
              </div>
            ))}
          </div>
        </ChartCard>

        <ChartCard title="Top 5 Least Affordable Regions" subtitle="By affordability index (higher = less affordable)">
          <div className="report-list">
            {top5LeastAfford.map((r, i) => (
              <div key={r.region} className="report-list-item">
                <span className="report-rank">{i + 1}</span>
                <span className="report-region">{r.region}</span>
                <span className="report-value red">{Number(r.affordability_index).toFixed(4)}</span>
              </div>
            ))}
          </div>
        </ChartCard>
      </div>

      <ChartCard title="Price Summary" subtitle={`${firstYear.year} to ${lastYear.year}`} fullWidth>
        <div className="report-list">
          {priceTrend.map((t) => (
            <div key={t.year} className="report-list-item">
              <span className="report-rank">{t.year}</span>
              <div className="report-bar-wrap">
                <div
                  className="report-bar"
                  style={{ width: `${(Number(t.avg_price) / Number(priceTrend[priceTrend.length - 1].avg_price)) * 100}%` }}
                />
              </div>
              <span className="report-value">{peso(t.avg_price)}</span>
            </div>
          ))}
        </div>
      </ChartCard>
    </PageLayout>
  )
}
