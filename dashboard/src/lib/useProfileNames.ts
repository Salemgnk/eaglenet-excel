import { useEffect, useMemo, useState } from 'react'
import { supabase } from './supabase'

interface ProfileName {
  id: string
  name: string | null
  email: string | null
}

// Resolves "who did this" across any table that stores a profile id
// (operator_id, created_by, recorded_by...) — a name/email lookup, not the
// full roster. `rolesCsv` is a comma-joined string rather than an array so
// it stays a stable effect dependency without the caller having to memoize.
export function useProfileNames(siteId: string | undefined, rolesCsv: string) {
  const [profiles, setProfiles] = useState<ProfileName[]>([])

  useEffect(() => {
    if (!siteId) return
    supabase
      .from('profiles')
      .select('id, name, email')
      .eq('site_id', siteId)
      .in('role', rolesCsv.split(','))
      .then(({ data }) => {
        if (data) setProfiles(data)
      })
  }, [siteId, rolesCsv])

  return useMemo(() => {
    const byId = new Map(profiles.map((p) => [p.id, p.name ?? p.email ?? 'Unknown']))
    return (id: string) => byId.get(id) ?? 'Unknown'
  }, [profiles])
}
