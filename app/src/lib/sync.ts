import { supabase } from './supabase'
import { deleteDraft, listDrafts } from './drafts'

export interface SyncResult {
  synced: number
  failed: number
}

const UNIQUE_VIOLATION = '23505'

export async function syncPendingDrafts(
  operatorId: string,
  siteId: string,
): Promise<SyncResult> {
  const drafts = await listDrafts()
  let synced = 0
  let failed = 0

  for (const draft of drafts) {
    const { error } = await supabase.from('entries').insert({
      id: draft.id,
      site_id: siteId,
      operator_id: operatorId,
      entry_type: draft.entry_type,
      bags_milled: draft.bags_milled,
      revenue: draft.revenue,
      expenses: draft.expenses,
      other: draft.other,
      notes: draft.notes || null,
      created_at: draft.created_at,
    })

    // A unique_violation means this draft's id was already inserted on a
    // previous attempt (e.g. the network dropped right after the server
    // accepted it, before we could delete the local copy) — the entry is
    // already synced, so it's safe to drop the draft rather than retry.
    if (!error || error.code === UNIQUE_VIOLATION) {
      await deleteDraft(draft.id)
      synced++
    } else {
      failed++
    }
  }

  return { synced, failed }
}
