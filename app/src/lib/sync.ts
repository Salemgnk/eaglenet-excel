import { supabase } from './supabase'
import { deleteDraft, listDrafts } from './drafts'
import { deletePendingClient, listPendingClients } from './clientsCache'
import { deleteSaleDraft, listSaleDrafts } from './salesDrafts'

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

// Pending clients must sync before pending sales: a sale's client_id is a
// foreign key, so a sale referencing a not-yet-synced client would be
// rejected until the client row exists remotely.
export async function syncPendingSales(
  operatorId: string,
  siteId: string,
): Promise<SyncResult> {
  const pendingClients = await listPendingClients()
  for (const client of pendingClients) {
    const { error } = await supabase.from('clients').insert({
      id: client.id,
      site_id: siteId,
      name: client.name,
      contact: client.contact,
    })
    if (!error || error.code === UNIQUE_VIOLATION) {
      await deletePendingClient(client.id)
    }
  }

  const drafts = await listSaleDrafts()
  let synced = 0
  let failed = 0

  for (const draft of drafts) {
    const { error } = await supabase.from('sales').insert({
      id: draft.id,
      site_id: siteId,
      client_id: draft.client_id,
      created_by: operatorId,
      bags_sold: draft.bags_sold,
      unit_price: draft.unit_price,
      total_amount: draft.total_amount,
      notes: draft.notes || null,
      created_at: draft.created_at,
    })

    // Same idempotent-retry reasoning as syncPendingDrafts. A sale whose
    // client hasn't synced yet (still pending above, e.g. this device
    // never came online long enough) legitimately fails here and is
    // retried on the next sync pass.
    if (!error || error.code === UNIQUE_VIOLATION) {
      await deleteSaleDraft(draft.id)
      synced++
    } else {
      failed++
    }
  }

  return { synced, failed }
}
