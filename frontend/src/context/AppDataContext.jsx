import { createContext, useContext, useState, useEffect, useMemo } from 'react'

const API_BASE = "http://localhost:3001/api"

export const peso    = (v) => `₱${Number(v).toFixed(2)}`
export const pesoAxis = (v) => `₱${Number(v).toFixed(0)}`

// NCR / CAR / BARMM arrive title-cased ("Ncr", "Car", "Barmm") from the API because
// the backend's generic title-case path runs on already-abbreviated DB values.
// Fix casing here — once, at the data boundary — so every consumer gets correct display.
const ACRONYMS = new Set(['ncr', 'car', 'barmm'])
const fixRegion  = (name) => (name && ACRONYMS.has(name.toLowerCase()) ? name.toUpperCase() : name)
const fixRegions = (rows) => rows.map((r) => ({ ...r, region: fixRegion(r.region) }))

const AppDataContext = createContext(null)

function useTheme() {
  const [dark, setDark] = useState(() => localStorage.getItem('theme') === 'dark')
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light')
    localStorage.setItem('theme', dark ? 'dark' : 'light')
  }, [dark])
  return [dark, () => setDark((d) => !d)]
}

export function AppDataProvider({ children }) {
  const [dark, toggleDark] = useTheme()

  const [kpis, setKpis]                   = useState(null)
  const [priceByRegion, setPriceByRegion] = useState([])
  const [priceTrend, setPriceTrend]       = useState([])
  const [affordability, setAffordability] = useState([])
  const [incomeByRegion, setIncomeByRegion]       = useState([])
  const [incomeTrend, setIncomeTrend]             = useState([])
  const [categoryBreakdown, setCategoryBreakdown] = useState([])
  const [error, setError]                         = useState(null)
  const [loading, setLoading]             = useState(true)
  const [selectedRegion, setSelectedRegion] = useState('All')
  const [selectedYear, setSelectedYear]   = useState('All')

  const GRID    = dark ? 'rgba(255,255,255,0.05)' : 'rgba(15,23,42,0.05)'
  const AXIS    = dark ? '#475569' : '#94a3b8'
  const TOOLTIP = dark
    ? { background: '#161b27', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, fontSize: 12, color: '#e2e8f0', boxShadow: '0 8px 24px rgba(0,0,0,0.5)' }
    : { background: '#ffffff', border: 'none', borderRadius: 10, fontSize: 12, color: '#0f172a', boxShadow: '0 8px 24px rgba(15,23,42,0.10)' }

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const responses = await Promise.all([
          fetch(`${API_BASE}/kpis`),
          fetch(`${API_BASE}/price-by-region`),
          fetch(`${API_BASE}/price-trend`),
          fetch(`${API_BASE}/affordability-by-region`),
          fetch(`${API_BASE}/income-by-region`),
          fetch(`${API_BASE}/income-trend`),
          fetch(`${API_BASE}/category-breakdown`),
        ])
        if (responses.some((r) => !r.ok)) throw new Error("One or more API requests failed")
        const [kpisData, regionData, trendData, affordData, incomeRegionData, incomeTrendData, categoryData] =
          await Promise.all(responses.map((r) => r.json()))
        setKpis(kpisData)
        setPriceByRegion(fixRegions(regionData))
        setPriceTrend(trendData)
        setAffordability(fixRegions(affordData))
        setIncomeByRegion(fixRegions(incomeRegionData))
        setIncomeTrend(incomeTrendData)
        setCategoryBreakdown(categoryData)
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
    [priceByRegion, selectedRegion])

  const filteredAffordability = useMemo(() =>
    selectedRegion === 'All' ? affordability : affordability.filter((r) => r.region === selectedRegion),
    [affordability, selectedRegion])

  const filteredPriceTrend = useMemo(() =>
    selectedYear === 'All' ? priceTrend : priceTrend.filter((t) => String(t.year) === selectedYear),
    [priceTrend, selectedYear])

  const filteredIncomeByRegion = useMemo(() =>
    selectedRegion === 'All' ? incomeByRegion : incomeByRegion.filter((r) => r.region === selectedRegion),
    [incomeByRegion, selectedRegion])

  const insights = useMemo(() => {
    if (!priceByRegion.length || !priceTrend.length || !affordability.length) return []
    const highest      = priceByRegion[0]
    const lowest       = priceByRegion[priceByRegion.length - 1]
    const mostAfford   = affordability[affordability.length - 1]
    const trendUp      = priceTrend.length >= 2 &&
      Number(priceTrend[priceTrend.length - 1].avg_price) > Number(priceTrend[0].avg_price)
    return [
      { label: 'Highest Priced Region', value: `${highest.region} — ${peso(highest.avg_price)}`,      type: 'danger'  },
      { label: 'Lowest Priced Region',  value: `${lowest.region} — ${peso(lowest.avg_price)}`,        type: 'success' },
      { label: 'Most Affordable',       value: mostAfford?.region ?? '—',                              type: 'info'    },
      { label: 'Price Trend',           value: trendUp ? 'Rising over time' : 'Declining over time',  type: trendUp ? 'danger' : 'success' },
    ]
  }, [priceByRegion, priceTrend, affordability])

  const derivedKpis = useMemo(() => ({
    topRegion:      priceByRegion[0]?.region ?? '—',
    topRegionPrice: priceByRegion[0] ? peso(priceByRegion[0].avg_price) : '—',
    mostAffordable: affordability[affordability.length - 1]?.region ?? '—',
  }), [priceByRegion, affordability])

  return (
    <AppDataContext.Provider value={{
      dark, toggleDark,
      kpis, priceByRegion, priceTrend, affordability, incomeByRegion, incomeTrend, categoryBreakdown,
      loading, error,
      selectedRegion, setSelectedRegion,
      selectedYear, setSelectedYear,
      regionOptions, yearOptions,
      filteredPriceByRegion, filteredAffordability, filteredPriceTrend, filteredIncomeByRegion,
      insights, derivedKpis,
      GRID, AXIS, TOOLTIP,
    }}>
      {children}
    </AppDataContext.Provider>
  )
}

export function useAppData() {
  return useContext(AppDataContext)
}
