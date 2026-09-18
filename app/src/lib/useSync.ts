import { useCallback, useEffect, useState } from 'react'
import { countDrafts } from './drafts'
import { syncPendingDrafts } from './sync'

export function useSync(operatorId: string | undefined, siteId: string | undefined) {
  const [pendingCount, setPendingCount] = useState(0)
  const [syncing, setSyncing] = useState(false)

  const refreshPendingCount = useCallback(async () => {
    setPendingCount(await countDrafts())
  }, [])

  const runSync = useCallback(async () => {
    if (!operatorId || !siteId || !navigator.onLine) return
    setSyncing(true)
    await syncPendingDrafts(operatorId, siteId)
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
