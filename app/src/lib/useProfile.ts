import { useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from './supabase'

export interface Profile {
  id: string
  role: 'operator' | 'owner'
  site_id: string
}

export function useProfile(session: Session | null) {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!session) {
      setProfile(null)
      setLoading(false)
      return
    }

    let cancelled = false
    setLoading(true)

    supabase
      .from('profiles')
      .select('id, role, site_id')
      .eq('id', session.user.id)
      .single()
      .then(({ data }) => {
        if (!cancelled) {
          setProfile((data as Profile | null) ?? null)
          setLoading(false)
        }
      })

    return () => {
      cancelled = true
    }
  }, [session])

  return { profile, loading }
}
