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
  { id: 'plan',   icon: '🗂️', label: 'Plan' },
  { id: 'map',    icon: '🗺️', label: 'Map'  },
  { id: 'eld',    icon: '📋', label: 'ELD'  },
  { id: 'status', icon: '⚡', label: 'HOS'  },
]

export default function App() {
  const [theme, setTheme] = useState(() => localStorage.getItem('haulsync-theme') || 'dark')
  const [mobileTab, setMobileTab] = useState('plan')

  // Apply theme to <html> element
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('haulsync-theme', theme)
  }, [theme])

  const toggleTheme = () => setTheme(t => t === 'dark' ? 'light' : 'dark')

  return (
    <QueryClientProvider client={queryClient}>
      <AppHeader theme={theme} onToggleTheme={toggleTheme} />

      <div className="app-layout">
        {/* Left: Trip Planner — hidden on mobile unless plan tab active */}
        <div className="panel" style={{ display: mobileTab === 'plan' ? undefined : undefined }}>
          <TripPlanner mobileTab={mobileTab} onMobileTabChange={setMobileTab} />
        </div>

        {/* Center: Map / ELD */}
        <CenterPanel forceMobileELD={mobileTab === 'eld'} />

        {/* Right: HOS Panel */}
        <div className="panel panel-right">
          <HOSPanel />
        </div>
      </div>

      {/* Mobile bottom tab bar */}
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
    </QueryClientProvider>
  )
}
