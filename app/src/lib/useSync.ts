import { useCallback, useEffect, useState } from 'react'
import { countPendingClients } from './clientsCache'
import { countDrafts } from './drafts'
import { countExpenseDrafts } from './expenseDrafts'
import { countLeaveDrafts } from './leaveRequests'
import { countPendingSuppliers } from './suppliersCache'
import { countPurchaseDrafts } from './purchaseDrafts'
import { countSaleDrafts } from './salesDrafts'
import {
  syncPendingDrafts,
  syncPendingExpenses,
  syncPendingLeaveRequests,
  syncPendingPurchases,
  syncPendingSales,
  syncPendingShifts,
} from './sync'
import { countShiftDrafts } from './timeEntries'

// navigator.onLine / the browser's online/offline events are unreliable in
// the field (they often just reflect "has a network interface", not "has
// real internet") — this interval is the safety net that keeps sync moving
// even when those events never fire for an actual reconnect.
const RETRY_INTERVAL_MS = 20_000

export function useSync(operatorId: string | undefined, siteId: string | undefined) {
  const [pendingCount, setPendingCount] = useState(0)
  const [syncing, setSyncing] = useState(false)
  // Bumped after every sync attempt that actually ran (i.e. was online) so
  // views like EntriesList know to refetch — the 'online' state flipping is
  // not the only thing that means "there might be new data now".
  const [syncVersion, setSyncVersion] = useState(0)

  const refreshPendingCount = useCallback(async () => {
    const [entries, sales, clients, purchases, suppliers, expenses, shifts, leave] =
      await Promise.all([
        countDrafts(),
        countSaleDrafts(),
        countPendingClients(),
        countPurchaseDrafts(),
        countPendingSuppliers(),
        countExpenseDrafts(),
        countShiftDrafts(),
        countLeaveDrafts(),
      ])
    setPendingCount(entries + sales + clients + purchases + suppliers + expenses + shifts + leave)
  }, [])

  const runSync = useCallback(async () => {
    if (!operatorId || !siteId || !navigator.onLine) return
    setSyncing(true)
    await syncPendingDrafts(operatorId, siteId)
    await syncPendingSales(operatorId, siteId)
    await syncPendingPurchases(operatorId, siteId)
    await syncPendingExpenses(operatorId, siteId)
    await syncPendingShifts(operatorId, siteId)
    await syncPendingLeaveRequests(operatorId, siteId)
    await refreshPendingCount()
    setSyncing(false)
    setSyncVersion((v) => v + 1)
  }, [operatorId, siteId, refreshPendingCount])

  useEffect(() => {
    refreshPendingCount()
  }, [refreshPendingCount])

  useEffect(() => {
    runSync()

    function onVisible() {
      if (document.visibilityState === 'visible') runSync()
    }

    window.addEventListener('online', runSync)
    document.addEventListener('visibilitychange', onVisible)
    const interval = setInterval(runSync, RETRY_INTERVAL_MS)

    return () => {
      window.removeEventListener('online', runSync)
      document.removeEventListener('visibilitychange', onVisible)
      clearInterval(interval)
    }
  }, [runSync])

  return { pendingCount, syncing, syncVersion, refreshPendingCount, runSync }
}
