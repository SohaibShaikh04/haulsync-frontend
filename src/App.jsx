import { useState, useEffect } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import AppHeader from './components/AppHeader'
import TripPlanner from './components/TripPlanner'
import CenterPanel from './components/CenterPanel'
import HOSPanel from './components/HOSPanel'
import './index.css'
import './styles/theme.css'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 5 * 60 * 1000 },
    mutations: { retry: 0 },
  },
})

const MOBILE_TABS = [
  { id: 'plan',   icon: '🗂️', label: 'Plan'  },
  { id: 'map',    icon: '🗺️', label: 'Map'   },
  { id: 'eld',    icon: '📋', label: 'ELD'   },
  { id: 'status', icon: '⚡', label: 'HOS'   },
]

export default function App() {
  const [theme, setTheme] = useState(() => localStorage.getItem('haulsync-theme') || 'dark')
  const [mobileTab, setMobileTab] = useState('plan')
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 720)

  // Apply theme to <html>
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('haulsync-theme', theme)
  }, [theme])

  // Track viewport width for mobile detection
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth <= 720)
    window.addEventListener('resize', handler)
    return () => window.removeEventListener('resize', handler)
  }, [])

  const toggleTheme = () => setTheme(t => t === 'dark' ? 'light' : 'dark')

  return (
    <QueryClientProvider client={queryClient}>
      <AppHeader theme={theme} onToggleTheme={toggleTheme} />

      {/* ── Desktop / Tablet layout ── */}
      {!isMobile && (
        <div className="app-layout">
          <div className="panel">
            <TripPlanner />
          </div>
          <CenterPanel />
          <div className="panel panel-right">
            <HOSPanel />
          </div>
        </div>
      )}

      {/* ── Mobile layout: one panel visible at a time ── */}
      {isMobile && (
        <div className="mobile-layout">
          <div className="mobile-panel" style={{ display: mobileTab === 'plan' ? 'flex' : 'none' }}>
            <TripPlanner />
          </div>
          <div className="mobile-panel" style={{ display: mobileTab === 'map' ? 'flex' : 'none' }}>
            <CenterPanel forceMap />
          </div>
          <div className="mobile-panel" style={{ display: mobileTab === 'eld' ? 'flex' : 'none' }}>
            <CenterPanel forceELD />
          </div>
          <div className="mobile-panel" style={{ display: mobileTab === 'status' ? 'flex' : 'none' }}>
            <HOSPanel />
          </div>
        </div>
      )}

      {/* Mobile tab bar */}
      {isMobile && (
        <nav className="mobile-tabs">
          {MOBILE_TABS.map(tab => (
            <button
              key={tab.id}
              className={`mobile-tab${mobileTab === tab.id ? ' active' : ''}`}
              onClick={() => setMobileTab(tab.id)}
            >
              <span className="mobile-tab-icon">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </nav>
      )}
    </QueryClientProvider>
  )
}
