import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { HomeAssistantProvider } from './contexts/HomeAssistantContext'
import { UserProvider } from './contexts/UserContext'
import { Layout } from './components/layout'
import { Dashboard, Lights, Music, Tasks, Rooms, Room, Styleguide } from './pages'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 30, // 30 seconds
      retry: 2,
      refetchOnWindowFocus: false,
    },
  },
})

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <HomeAssistantProvider>
        <UserProvider>
          <BrowserRouter>
            <Layout>
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/lights" element={<Lights />} />
                <Route path="/music" element={<Music />} />
                <Route path="/tasks" element={<Tasks />} />
                <Route path="/rooms" element={<Rooms />} />
                <Route path="/room/:areaId" element={<Room />} />
                <Route path="/styleguide" element={<Styleguide />} />
              </Routes>
            </Layout>
          </BrowserRouter>
        </UserProvider>
      </HomeAssistantProvider>
    </QueryClientProvider>
  )
}
