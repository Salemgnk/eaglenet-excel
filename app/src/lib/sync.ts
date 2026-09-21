import { supabase } from './supabase'
import { deleteDraft, listDrafts } from './drafts'
import { deletePendingClient, listPendingClients } from './clientsCache'
import { deleteLeaveDraft, listLeaveDrafts } from './leaveRequests'
import { deletePendingSupplier, listPendingSuppliers } from './suppliersCache'
import { deletePurchaseDraft, listPurchaseDrafts } from './purchaseDrafts'
import { deleteSaleDraft, listSaleDrafts } from './salesDrafts'
import { deleteShiftDraft, listShiftDrafts } from './timeEntries'

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

// Mirrors syncPendingSales: pending suppliers before pending purchases,
// same foreign-key-ordering reason.
export async function syncPendingPurchases(
  operatorId: string,
  siteId: string,
): Promise<SyncResult> {
  const pendingSuppliers = await listPendingSuppliers()
  for (const supplier of pendingSuppliers) {
    const { error } = await supabase.from('suppliers').insert({
      id: supplier.id,
      site_id: siteId,
      name: supplier.name,
      contact: supplier.contact,
    })
    if (!error || error.code === UNIQUE_VIOLATION) {
      await deletePendingSupplier(supplier.id)
    }
  }

  const drafts = await listPurchaseDrafts()
  let synced = 0
  let failed = 0

  for (const draft of drafts) {
    const { error } = await supabase.from('purchases').insert({
      id: draft.id,
      site_id: siteId,
      supplier_id: draft.supplier_id,
      created_by: operatorId,
      bags_bought: draft.bags_bought,
      unit_price: draft.unit_price,
      total_amount: draft.total_amount,
      notes: draft.notes || null,
      created_at: draft.created_at,
    })

    if (!error || error.code === UNIQUE_VIOLATION) {
      await deletePurchaseDraft(draft.id)
      synced++
    } else {
      failed++
    }
  }

  return { synced, failed }
}

// A shift is one logical row whether it's synced once (clock-in) or
// twice (clock-in, then clock-out) — upsert rather than insert, so
// completing a shift never needs to know whether the clock-in leg
// already reached the server.
export async function syncPendingShifts(
  employeeId: string,
  siteId: string,
): Promise<SyncResult> {
  const drafts = await listShiftDrafts()
  let synced = 0
  let failed = 0

  for (const draft of drafts) {
    const { error } = await supabase.from('time_entries').upsert({
      id: draft.id,
      site_id: siteId,
      employee_id: employeeId,
      clock_in: draft.clock_in,
      clock_out: draft.clock_out,
    })

    if (!error) {
      // Only drop the local draft once the shift is complete — an open
      // shift (no clock_out yet) stays local so the app still knows a
      // shift is in progress, synced or not.
      if (draft.clock_out) await deleteShiftDraft(draft.id)
      synced++
    } else {
      failed++
    }
  }

  return { synced, failed }
}

export async function syncPendingLeaveRequests(
  employeeId: string,
  siteId: string,
): Promise<SyncResult> {
  const drafts = await listLeaveDrafts()
  let synced = 0
  let failed = 0

  for (const draft of drafts) {
    const { error } = await supabase.from('leave_requests').insert({
      id: draft.id,
      site_id: siteId,
      employee_id: employeeId,
      date: draft.date,
      reason: draft.reason || null,
      created_at: draft.created_at,
    })

    if (!error || error.code === UNIQUE_VIOLATION) {
      await deleteLeaveDraft(draft.id)
      synced++
    } else {
      failed++
    }
  }

  return { synced, failed }
}
