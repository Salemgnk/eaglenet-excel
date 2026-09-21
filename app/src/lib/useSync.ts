import { useCallback, useEffect, useState } from 'react'
import { countPendingClients } from './clientsCache'
import { countDrafts } from './drafts'
import { countPendingSuppliers } from './suppliersCache'
import { countPurchaseDrafts } from './purchaseDrafts'
import { countSaleDrafts } from './salesDrafts'
import { syncPendingDrafts, syncPendingPurchases, syncPendingSales } from './sync'

export function useSync(operatorId: string | undefined, siteId: string | undefined) {
  const [pendingCount, setPendingCount] = useState(0)
  const [syncing, setSyncing] = useState(false)

  const refreshPendingCount = useCallback(async () => {
    const [entries, sales, clients, purchases, suppliers] = await Promise.all([
      countDrafts(),
      countSaleDrafts(),
      countPendingClients(),
      countPurchaseDrafts(),
      countPendingSuppliers(),
    ])
    setPendingCount(entries + sales + clients + purchases + suppliers)
  }, [])

  const runSync = useCallback(async () => {
    if (!operatorId || !siteId || !navigator.onLine) return
    setSyncing(true)
    await syncPendingDrafts(operatorId, siteId)
    await syncPendingSales(operatorId, siteId)
    await syncPendingPurchases(operatorId, siteId)
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
