import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import AppHeader from './components/AppHeader'
import TripPlanner from './components/TripPlanner'
import CenterPanel from './components/CenterPanel'
import HOSPanel from './components/HOSPanel'
import './index.css'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 5 * 60 * 1000 },
    mutations: { retry: 0 },
  },
})

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppHeader />
      <div className="app-layout">
        <TripPlanner />
        <CenterPanel />
        <HOSPanel />
      </div>
    </QueryClientProvider>
  )
}
