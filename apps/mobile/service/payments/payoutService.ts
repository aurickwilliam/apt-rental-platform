import { supabase } from '@repo/supabase'

export interface PayoutRecord {
  id: string
  created_at: string
  updated_at: string
  amount: number | null
  fee: number | null
  net_amount: number | null
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'returned'
  reference_number: string | null
  attempt: number | null
  period_start: string | null
  period_end: string | null
  paymongo_batch_id: string | null
  paymongo_transfer_id: string | null
  failure_reason: string | null
  completed_at: string | null
  destination: {
    id: string
    type: string
    account_number: string
    account_name: string
    bic: string
  } | null
}

type PayoutRow = {
  id: string
  created_at: string
  updated_at: string
  amount: number | null
  fee: number | null
  net_amount: number | null
  status: string
  reference_number: string | null
  attempt: number | null
  period_start: string | null
  period_end: string | null
  paymongo_batch_id: string | null
  paymongo_transfer_id: string | null
  failure_reason: string | null
  completed_at: string | null
  destination: {
    id: string
    type: string
    account_number: string
    account_name: string
    bic: string
  } | null
}

const PAYOUT_SELECT = `
  id,
  created_at,
  updated_at,
  amount,
  fee,
  net_amount,
  status,
  reference_number,
  attempt,
  period_start,
  period_end,
  paymongo_batch_id,
  paymongo_transfer_id,
  failure_reason,
  completed_at,
  destination:payout_destination (
    id,
    type,
    account_number,
    account_name,
    bic
  )
`

const toPayoutRecord = (row: PayoutRow): PayoutRecord => ({
  id: row.id,
  created_at: row.created_at,
  updated_at: row.updated_at,
  amount: row.amount,
  fee: row.fee,
  net_amount: row.net_amount,
  status: row.status as PayoutRecord['status'],
  reference_number: row.reference_number,
  attempt: row.attempt,
  period_start: row.period_start,
  period_end: row.period_end,
  paymongo_batch_id: row.paymongo_batch_id,
  paymongo_transfer_id: row.paymongo_transfer_id,
  failure_reason: row.failure_reason,
  completed_at: row.completed_at,
  destination: row.destination ?? null,
})

export async function fetchPayouts(): Promise<PayoutRecord[]> {
  const { data, error } = await supabase
    .from('payout')
    .select(PAYOUT_SELECT)
    .order('created_at', { ascending: false })
    .limit(100)

  if (error) throw error
  return (data as unknown as PayoutRow[]).map(toPayoutRecord)
}

export async function fetchPayoutById(id: string): Promise<PayoutRecord | null> {
  const { data, error } = await supabase
    .from('payout')
    .select(PAYOUT_SELECT)
    .eq('id', id)
    .maybeSingle()

  if (error) throw error
  return data ? toPayoutRecord(data as unknown as PayoutRow) : null
}

export async function fetchPayoutPayments(payoutId: string) {
  const { data, error } = await supabase
    .from('payment')
    .select('id, amount, date, period_start, period_end, status, method, apartment:apartments(name)')
    .eq('payout_id', payoutId)
    .order('period_start', { ascending: false })

  if (error) throw error
  return data ?? []
}

const PAYOUT_STATUS_LABELS: Record<string, string> = {
  pending: 'Pending',
  processing: 'In Transit',
  completed: 'Delivered',
  failed: 'Failed',
  returned: 'Returned',
}

export function payoutStatusLabel(status: string): string {
  return PAYOUT_STATUS_LABELS[status] ?? status
}
