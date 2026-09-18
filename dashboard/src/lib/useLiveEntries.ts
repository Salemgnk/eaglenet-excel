import { useEffect, useState } from 'react'
import { supabase } from './supabase'

export interface Entry {
  id: string
  bags_milled: number
  revenue: number
  expenses: number
  other: number
  notes: string | null
  created_at: string
}

export function useLiveEntries(siteId: string | undefined) {
  const [entries, setEntries] = useState<Entry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!siteId) return

    let cancelled = false
    setLoading(true)

    supabase
      .from('entries')
      .select('id, bags_milled, revenue, expenses, other, notes, created_at')
      .eq('site_id', siteId)
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (!cancelled && !error && data) setEntries(data)
        if (!cancelled) setLoading(false)
      })

    const channel = supabase
      .channel(`entries-${siteId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'entries', filter: `site_id=eq.${siteId}` },
        (payload) => {
          setEntries((current) => {
            if (payload.eventType === 'INSERT') {
              const incoming = payload.new as Entry
              if (current.some((e) => e.id === incoming.id)) return current
              return [incoming, ...current].sort((a, b) =>
                b.created_at.localeCompare(a.created_at),
              )
            }
            if (payload.eventType === 'UPDATE') {
              const updated = payload.new as Entry
              return current.map((e) => (e.id === updated.id ? updated : e))
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
  }, [siteId])

  return { entries, loading }
}
