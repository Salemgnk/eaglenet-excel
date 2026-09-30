import { useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from './supabase'

export interface Profile {
  id: string
  role: 'operator' | 'owner' | 'employee'
  site_id: string
  must_change_password: boolean
}

export function useProfile(session: Session | null) {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshIndex, setRefreshIndex] = useState(0)

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
      .select('id, role, site_id, must_change_password')
      .eq('id', session.user.id)
      .single()
      .then(({ data, error }) => {
        if (error) console.error('Failed to load profile:', error.message)
        if (!cancelled) {
          setProfile((data as Profile | null) ?? null)
          setLoading(false)
        }
      })

    return () => {
      cancelled = true
    }
  }, [session, refreshIndex])

  const refresh = () => setRefreshIndex((n) => n + 1)

  return { profile, loading, refresh }
}
