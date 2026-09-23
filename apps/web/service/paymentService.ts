"use client";

import { createClient } from "@repo/supabase/browser";

// Web twin of mobile service/payments/paymentService.ts (read-only study, not modified).
// Same `payment` table contract: lowercase DB values, display mapping in
// app/tenant/payment/utils.ts. Tenants insert cash `pending` only — never flip status.

export type PaymentMethodDb = "gcash" | "maya" | "card" | "cash" | "qrph";

export type PaymentStatusDb = "pending" | "paid" | "partial" | "unpaid";

export interface PaymentRecord {
  id: string;
  created_at: string;
  date: string;
  amount: number | null;
  status: string;
  method: string | null;
  reference_id: string | null;
  period_start: string | null;
  period_end: string | null;
  due_date: string | null;
  apartment_name: string | null;
  landlord_name: string | null;
  tenant_name: string | null;
}

type PaymentRow = {
  id: string;
  created_at: string;
  date: string;
  amount: number | null;
  status: string;
  method: string | null;
  reference_id: string | null;
  period_start: string | null;
  period_end: string | null;
  due_date: string | null;
  apartment: {
    name: string | null;
    landlord: { first_name: string | null; last_name: string | null } | null;
  } | null;
  tenant: { first_name: string | null; last_name: string | null } | null;
};

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
  apartment:apartments (
    name,
    landlord:users (first_name, last_name)
  ),
  tenant:users!payment_tenant_id_fkey (first_name, last_name)
`;

function toPaymentRecord(row: PaymentRow): PaymentRecord {
  const landlord = row.apartment?.landlord;
  const tenant = row.tenant;
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
    apartment_name: row.apartment?.name ?? null,
    landlord_name:
      landlord?.first_name || landlord?.last_name
        ? `${landlord.first_name ?? ""} ${landlord.last_name ?? ""}`.trim()
        : null,
    tenant_name:
      tenant?.first_name || tenant?.last_name
        ? `${tenant.first_name ?? ""} ${tenant.last_name ?? ""}`.trim()
        : null,
  };
}

export const PAYMENTS_HISTORY_LIMIT = 200;

export async function fetchPayments(tenancyId: string): Promise<PaymentRecord[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("payment")
    .select(PAYMENT_SELECT)
    .eq("tenancy_id", tenancyId)
    .order("period_start", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(PAYMENTS_HISTORY_LIMIT);

  if (error) throw error;
  return (data as unknown as PaymentRow[]).map(toPaymentRecord);
}

export async function fetchPaymentById(id: string): Promise<PaymentRecord | null> {
  const supabase = createClient();
  const { data, error } = await supabase.from("payment").select(PAYMENT_SELECT).eq("id", id).maybeSingle();

  if (error) throw error;
  return data ? toPaymentRecord(data as unknown as PaymentRow) : null;
}

export async function fetchPaymentByReferenceId(referenceId: string): Promise<PaymentRecord | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("payment")
    .select(PAYMENT_SELECT)
    .eq("reference_id", referenceId)
    .maybeSingle();

  if (error) throw error;
  return data ? toPaymentRecord(data as unknown as PaymentRow) : null;
}

export type CreateCashPaymentParams = {
  referenceId: string;
  amount: number;
  date: string;
  tenantId: string;
  apartmentId: string;
  tenancyId: string;
  periodStart: string | null;
  periodEnd: string | null;
  dueDate: string | null;
};

export async function createCashPayment(params: CreateCashPaymentParams): Promise<PaymentRecord> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("payment")
    .insert({
      method: "cash",
      status: "pending",
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
    .single();

  if (error) throw error;
  return toPaymentRecord(data as unknown as PaymentRow);
}

// Sum of confirmed payments covering the given period start.
export function paidAmountForPeriod(payments: PaymentRecord[], periodStart: string): number {
  return payments
    .filter((payment) => payment.status === "paid" && payment.period_start === periodStart)
    .reduce((sum, payment) => sum + (payment.amount ?? 0), 0);
}

// The period being paid for: the tenancy's current payment period when it
// covers this month, otherwise the current calendar month (due on the 5th).
export function resolvePaymentPeriod(
  currentPeriodStart: string | null,
  currentPeriodEnd: string | null,
  currentDueDate: string | null,
): {
  periodStart: string;
  periodEnd: string;
  dueDate: string;
} {
  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  if (currentPeriodStart?.startsWith(currentMonth)) {
    return {
      periodStart: currentPeriodStart,
      periodEnd: currentPeriodEnd ?? currentPeriodStart,
      dueDate: currentDueDate ?? `${currentMonth}-05`,
    };
  }

  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  return {
    periodStart: `${currentMonth}-01`,
    periodEnd: `${currentMonth}-${String(lastDay).padStart(2, "0")}`,
    dueDate: `${currentMonth}-05`,
  };
}
