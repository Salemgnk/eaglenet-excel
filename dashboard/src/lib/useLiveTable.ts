import { useEffect, useState } from 'react'
import { supabase } from './supabase'

interface Row {
  id: string
  created_at: string
}

// Shared by every "live list scoped to a site" hook (clients, sales,
// payments — entries has its own copy, predating this, left as-is).
// Fetches once, then keeps the list current via a Realtime subscription:
// INSERT prepends (de-duplicated, re-sorted), UPDATE replaces by id,
// DELETE removes by id (Postgres always sends the primary key in `old`,
// even without REPLICA IDENTITY FULL).
export function useLiveTable<T extends Row>(table: string, columns: string, siteId: string | undefined) {
  const [rows, setRows] = useState<T[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!siteId) return

    let cancelled = false
    setLoading(true)

    supabase
      .from(table)
      .select(columns)
      .eq('site_id', siteId)
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (!cancelled && !error && data) setRows(data as unknown as T[])
        if (!cancelled) setLoading(false)
      })

    const channel = supabase
      .channel(`${table}-${siteId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table, filter: `site_id=eq.${siteId}` },
        (payload) => {
          setRows((current) => {
            if (payload.eventType === 'INSERT') {
              const incoming = payload.new as T
              if (current.some((r) => r.id === incoming.id)) return current
              return [incoming, ...current].sort((a, b) => b.created_at.localeCompare(a.created_at))
            }
            if (payload.eventType === 'UPDATE') {
              const updated = payload.new as T
              return current.map((r) => (r.id === updated.id ? updated : r))
            }
            if (payload.eventType === 'DELETE') {
              const removedId = (payload.old as Partial<T>).id
              return current.filter((r) => r.id !== removedId)
            }
            return current
          })
        },
      )
      .subscribe()

    return () => {
      cancelled = true
      supabase.removeChannel(channel)
    }
  }, [table, columns, siteId])

  return { rows, loading }
}
