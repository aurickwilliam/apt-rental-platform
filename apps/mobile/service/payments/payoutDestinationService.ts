import { supabase } from '@repo/supabase'

import { PAYOUT_DESTINATION_BICS, type PayoutDestinationType } from '@repo/constants'

// Client for the landlord's payout_destination rows. RLS scopes every read and
// write to the signed-in user; INSERT/UPDATE additionally require
// users.account_status = 'verified' (the UI gates on this before navigating).
//
// process-payouts disburses to the row with is_default = true and
// status = 'active', so at most one default is enforced client-side here.

export interface PayoutDestinationRecord {
  id: string
  type: PayoutDestinationType
  bic: string
  account_number: string
  account_name: string
  is_default: boolean
  status: 'active' | 'inactive'
  created_at: string
}

export type SavePayoutDestinationParams = {
  type: PayoutDestinationType
  accountNumber: string
  accountName: string
  isDefault: boolean
}

const DESTINATION_SELECT =
  'id, type, bic, account_number, account_name, is_default, status, created_at'

export async function fetchPayoutDestinations(): Promise<PayoutDestinationRecord[]> {
  const { data, error } = await supabase
    .from('payout_destination')
    .select(DESTINATION_SELECT)
    .order('is_default', { ascending: false })
    .order('created_at', { ascending: false })

  if (error) throw error
  return (data ?? []) as PayoutDestinationRecord[]
}

export async function createPayoutDestination(
  userId: string,
  params: SavePayoutDestinationParams
): Promise<PayoutDestinationRecord> {
  // When the new row becomes the default, clear the previous default BEFORE
  // inserting so the whole save produces a single tripwire notification (the
  // insert) instead of insert + clear + set.
  if (params.isDefault) {
    const { error: clearError } = await supabase
      .from('payout_destination')
      .update({ is_default: false, updated_at: new Date().toISOString() })
      .eq('user_id', userId)
      .eq('is_default', true)

    if (clearError) throw clearError
  }

  const { data, error } = await supabase
    .from('payout_destination')
    .insert({
      user_id: userId,
      type: params.type,
      // Derived from type — the client never supplies the BIC, so a mismatched
      // rail/code pair can't be persisted.
      bic: PAYOUT_DESTINATION_BICS[params.type],
      account_number: params.accountNumber,
      account_name: params.accountName.trim(),
      is_default: params.isDefault,
    })
    .select(DESTINATION_SELECT)
    .single()

  if (error) throw error

  return data as PayoutDestinationRecord
}

export async function updatePayoutDestination(
  destinationId: string,
  params: SavePayoutDestinationParams
): Promise<void> {
  const { error } = await supabase
    .from('payout_destination')
    .update({
      type: params.type,
      // Re-derived on every save so switching rails (GCash <-> Maya) never
      // leaves a stale BIC behind.
      bic: PAYOUT_DESTINATION_BICS[params.type],
      account_number: params.accountNumber,
      account_name: params.accountName.trim(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', destinationId)

  if (error) throw error
}

// Two sequential RLS-scoped updates: clear the current default(s), then set
// the new one. A failure in between leaves zero defaults — surfaced by
// process-payouts as "No active default payout destination." until retried.
// No-op when the row is already the default: saving an already-default row
// must not run the clear/re-set cycle (it produces a duplicate tripwire
// notification and touches rows for nothing).
export async function setDefaultPayoutDestination(
  userId: string,
  destinationId: string
): Promise<void> {
  const { data: current, error: fetchError } = await supabase
    .from('payout_destination')
    .select('id')
    .eq('user_id', userId)
    .eq('is_default', true)
    .maybeSingle()

  if (fetchError) throw fetchError
  if (current?.id === destinationId) return

  const { error: clearError } = await supabase
    .from('payout_destination')
    .update({ is_default: false, updated_at: new Date().toISOString() })
    .eq('user_id', userId)
    .eq('is_default', true)

  if (clearError) throw clearError

  const { error } = await supabase
    .from('payout_destination')
    .update({ is_default: true, updated_at: new Date().toISOString() })
    .eq('id', destinationId)
    .eq('user_id', userId)

  if (error) throw error
}

export async function deletePayoutDestination(destinationId: string): Promise<void> {
  const { error } = await supabase
    .from('payout_destination')
    .delete()
    .eq('id', destinationId)

  if (error) {
    // 23503 — foreign_key_violation: a payout row references this destination.
    if (error.code === '23503') {
      throw new Error(
        'This account was used in past payouts and cannot be deleted. Add a new account and set it as default instead.'
      )
    }
    throw error
  }
}
