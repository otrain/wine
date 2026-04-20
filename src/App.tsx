import { useEffect } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BottomNav, NAV_HEIGHT } from '@/components/BottomNav'
import { DashboardPage } from '@/features/dashboard/DashboardPage'
import { WineListPage } from '@/features/wine-list/WineListPage'
import { WineFormPage } from '@/features/wine-form/WineFormPage'
import { WineDetailPage } from '@/features/wine-detail/WineDetailPage'
import { ExplorePage } from '@/features/explore/ExplorePage'
import { ExportPage } from '@/features/export/ExportPage'
import { flushQueue } from '@/lib/syncQueue'
import { useOnlineStatus } from '@/lib/hooks/useOnlineStatus'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
    },
  },
})

function AppContent() {
  const { isOnline, pendingCount } = useOnlineStatus()

  useEffect(() => {
    // Flush on initial load — catches anything that failed last session
    flushQueue()

    // Flush when connectivity is restored (desktop + Android Chrome)
    const handleOnline = () => flushQueue()
    window.addEventListener('online', handleOnline)

    // Flush when user returns to the app (iOS-safe — Background Sync not available on iOS)
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') flushQueue()
    }
    document.addEventListener('visibilitychange', handleVisibility)

    return () => {
      window.removeEventListener('online', handleOnline)
      document.removeEventListener('visibilitychange', handleVisibility)
    }
  }, [])

  return (
    <BrowserRouter>
      <div style={{ paddingBottom: NAV_HEIGHT }}>
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/wines" element={<WineListPage />} />
          <Route path="/wines/new" element={<WineFormPage mode="create" />} />
          <Route path="/wines/:id" element={<WineDetailPage />} />
          <Route path="/wines/:id/edit" element={<WineFormPage mode="edit" />} />
          <Route path="/explore" element={<ExplorePage />} />
          <Route path="/export" element={<ExportPage />} />
        </Routes>
      </div>
      <BottomNav />
      {!isOnline && (
        <div className="fixed bottom-16 inset-x-0 bg-amber-800 text-amber-100 text-sm text-center py-1 z-50">
          Offline{pendingCount > 0 ? ` — ${pendingCount} change${pendingCount === 1 ? '' : 's'} saved locally` : ' — entries will sync when reconnected'}
        </div>
      )}
    </BrowserRouter>
  )
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppContent />
    </QueryClientProvider>
  )
}
