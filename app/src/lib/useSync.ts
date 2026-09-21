import { useCallback, useEffect, useState } from 'react'
import { countPendingClients } from './clientsCache'
import { countDrafts } from './drafts'
import { countSaleDrafts } from './salesDrafts'
import { syncPendingDrafts, syncPendingSales } from './sync'

export function useSync(operatorId: string | undefined, siteId: string | undefined) {
  const [pendingCount, setPendingCount] = useState(0)
  const [syncing, setSyncing] = useState(false)

  const refreshPendingCount = useCallback(async () => {
    const [entries, sales, clients] = await Promise.all([
      countDrafts(),
      countSaleDrafts(),
      countPendingClients(),
    ])
    setPendingCount(entries + sales + clients)
  }, [])

  const runSync = useCallback(async () => {
    if (!operatorId || !siteId || !navigator.onLine) return
    setSyncing(true)
    await syncPendingDrafts(operatorId, siteId)
    await syncPendingSales(operatorId, siteId)
    await refreshPendingCount()
    setSyncing(false)
  }, [operatorId, siteId, refreshPendingCount])

  useEffect(() => {
    refreshPendingCount()
  }, [refreshPendingCount])

  useEffect(() => {
    runSync()
    window.addEventListener('online', runSync)
    return () => window.removeEventListener('online', runSync)
  }, [runSync])

  return { pendingCount, syncing, refreshPendingCount, runSync }
}
