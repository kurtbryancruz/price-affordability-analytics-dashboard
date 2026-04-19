import { Routes, Route, Navigate } from 'react-router-dom'
import { AppDataProvider, useAppData } from './context/AppDataContext'
import Sidebar from './components/Sidebar'
import Overview from './pages/Overview'
import IncomeAnalysis from './pages/IncomeAnalysis'
import RegionalAnalysis from './pages/RegionalAnalysis'
import Affordability from './pages/Affordability'
import Reports from './pages/Reports'
import './App.css'

function AppShell() {
  const { loading, error } = useAppData()

  if (loading) return <div className="full-screen-status">Loading dashboard…</div>
  if (error)   return <div className="full-screen-status error">{error}</div>

  return (
    <div className="app-shell">
      <Sidebar />
      <div className="main-area">
        <Routes>
          <Route path="/" element={<Navigate to="/overview" replace />} />
          <Route path="/overview"      element={<Overview />} />
          <Route path="/income"        element={<IncomeAnalysis />} />
          <Route path="/regional"      element={<RegionalAnalysis />} />
          <Route path="/affordability" element={<Affordability />} />
          <Route path="/reports"       element={<Reports />} />
        </Routes>
      </div>
    </div>
  )
}

export default function App() {
  return (
    <AppDataProvider>
      <AppShell />
    </AppDataProvider>
  )
}
