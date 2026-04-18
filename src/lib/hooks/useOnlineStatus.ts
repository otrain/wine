import { useEffect, useState } from 'react'
import { getPendingQueue } from '@/lib/syncQueue'

export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [pendingCount, setPendingCount] = useState(0)

  useEffect(() => {
    const on = () => setIsOnline(true)
    const off = () => setIsOnline(false)
    window.addEventListener('online', on)
    window.addEventListener('offline', off)
    return () => {
      window.removeEventListener('online', on)
      window.removeEventListener('offline', off)
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    getPendingQueue().then(items => {
      if (!cancelled) setPendingCount(items.length)
    })
    return () => { cancelled = true }
  }, [isOnline])

  return { isOnline, pendingCount }
}
