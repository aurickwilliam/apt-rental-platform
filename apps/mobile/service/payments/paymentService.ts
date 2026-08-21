import { supabase } from '@repo/supabase'

import type { PaymentStatus } from '@/hooks/payments'

// Client for payment rows on the `payment` table. Rows for GCash/Maya/card are
// created server-side (edge function / webhook); cash rows are inserted here
// with status 'pending' — the tenant has paid, awaiting landlord confirmation —
// and only the landlord (or service role) flips them to 'paid'. Tenants never
// write status — RLS enforces that.

export interface PaymentRecord {
  id: string
  created_at: string
  date: string
  amount: number | null
  status: string
  method: string | null
  reference_id: string | null
  period_start: string | null
  period_end: string | null
  due_date: string | null
  apartment_name: string | null
  landlord_name: string | null
  // FIX 1 — server-derived refund eligibility (GCash/Maya/card only, with a
  // captured PayMongo payment). Generated column; tenants only read it.
  is_refundable: boolean
}

type PaymentRow = {
  id: string
  created_at: string
  date: string
  amount: number | null
  status: string
  method: string | null
  reference_id: string | null
  period_start: string | null
  period_end: string | null
  due_date: string | null
  is_refundable: boolean
  apartment: { name: string | null; landlord: { first_name: string | null; last_name: string | null } | null } | null
}

const PAYMENT_SELECT = `
  id,
  created_at,
  date,
  amount,
  status,
  method,
  reference_id,
  period_start,
  period_end,
  due_date,
  is_refundable,
  apartment:apartments (
    name,
    landlord:users (first_name, last_name)
  )
`

const toPaymentRecord = (row: PaymentRow): PaymentRecord => {
  const landlord = row.apartment?.landlord
  return {
    id: row.id,
    created_at: row.created_at,
    date: row.date,
    amount: row.amount,
    status: row.status,
    method: row.method,
    reference_id: row.reference_id,
    period_start: row.period_start,
    period_end: row.period_end,
    due_date: row.due_date,
    is_refundable: row.is_refundable,
    apartment_name: row.apartment?.name ?? null,
    landlord_name:
      landlord?.first_name || landlord?.last_name
        ? `${landlord.first_name ?? ''} ${landlord.last_name ?? ''}`.trim()
        : null,
  }
}

export async function fetchPayments(tenancyId: string): Promise<PaymentRecord[]> {
  const { data, error } = await supabase
    .from('payment')
    .select(PAYMENT_SELECT)
    .eq('tenancy_id', tenancyId)
    .order('period_start', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(200)

  if (error) throw error
  return (data as unknown as PaymentRow[]).map(toPaymentRecord)
}

export async function fetchPaymentById(id: string): Promise<PaymentRecord | null> {
  const { data, error } = await supabase
    .from('payment')
    .select(PAYMENT_SELECT)
    .eq('id', id)
    .maybeSingle()

  if (error) throw error
  return data ? toPaymentRecord(data as unknown as PaymentRow) : null
}

export async function fetchPaymentByReferenceId(referenceId: string): Promise<PaymentRecord | null> {
  const { data, error } = await supabase
    .from('payment')
    .select(PAYMENT_SELECT)
    .eq('reference_id', referenceId)
    .maybeSingle()

  if (error) throw error
  return data ? toPaymentRecord(data as unknown as PaymentRow) : null
}

// --- Refunds (tenant-facing; rows are written by the edge function) ---------

export interface RefundRecord {
  id: string
  payment_id: string
  amount: number
  status: string
  reason: string | null
  failure_reason: string | null
  created_at: string
  completed_at: string | null
}

export async function fetchRefundsForPayment(paymentId: string): Promise<RefundRecord[]> {
  const { data, error } = await supabase
    .from('refund')
    .select(
      'id, payment_id, amount, status, reason, failure_reason, created_at, completed_at'
    )
    .eq('payment_id', paymentId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data as RefundRecord[]
}

const REFUND_STATUS_LABELS: Record<string, string> = {
  pending: 'Refund in progress',
  processing: 'Refund in progress',
  succeeded: 'Refunded',
  failed: 'Refund failed',
}

export function refundStatusLabel(status: string): string {
  return REFUND_STATUS_LABELS[status] ?? 'Refund in progress'
}

export type CreateCashPaymentParams = {
  referenceId: string
  amount: number
  date: string
  tenantId: string
  apartmentId: string
  tenancyId: string
  periodStart: string | null
  periodEnd: string | null
  dueDate: string | null
}

export async function createCashPayment(params: CreateCashPaymentParams): Promise<PaymentRecord> {
  const { data, error } = await supabase
    .from('payment')
    .insert({
      method: 'cash',
      status: 'pending',
      date: params.date,
      amount: params.amount,
      reference_id: params.referenceId,
      tenant_id: params.tenantId,
      apartment_id: params.apartmentId,
      tenancy_id: params.tenancyId,
      period_start: params.periodStart,
      period_end: params.periodEnd,
      due_date: params.dueDate,
    })
    .select(PAYMENT_SELECT)
    .single()

  if (error) throw error
  return toPaymentRecord(data as unknown as PaymentRow)
}

// --- Pure display helpers ---------------------------------------------------

export function formatReferenceId(referenceId: string | null): string {
  if (!referenceId) return '—'
  return `APT-${referenceId.replace(/^pay_/, '').toUpperCase()}`
}

const METHOD_LABELS: Record<string, string> = {
  gcash: 'GCash',
  maya: 'Maya',
  card: 'Debit/Credit Card',
  cash: 'Cash',
}

export function methodLabel(method: string | null): string {
  return method ? METHOD_LABELS[method] ?? method : '—'
}

const STATUS_LABELS: Record<string, PaymentStatus> = {
  paid: 'Paid',
  pending: 'Pending',
  partial: 'Partial',
  unpaid: 'Unpaid',
}

export function paymentStatusLabel(status: string): PaymentStatus {
  return STATUS_LABELS[status] ?? 'Unpaid'
}

// Sum of confirmed payments covering the given period start. Only rows that
// actually paid count toward the due amount; pending/unpaid/partial don't.
export function paidAmountForPeriod(payments: PaymentRecord[], periodStart: string): number {
  return payments
    .filter((payment) => payment.status === 'paid' && payment.period_start === periodStart)
    .reduce((sum, payment) => sum + (payment.amount ?? 0), 0)
}

export function periodMonthLabel(periodStart: string | null, fallbackDate: string): string {
  const source = periodStart ?? fallbackDate
  const date = new Date(`${source.slice(0, 10)}T00:00:00`)
  if (Number.isNaN(date.getTime())) return '—'
  return new Intl.DateTimeFormat('en-US', { month: 'long' }).format(date)
}
