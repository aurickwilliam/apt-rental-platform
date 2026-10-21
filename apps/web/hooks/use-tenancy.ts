"use client";

import { createClient } from "@repo/supabase/browser";
import type { TenancyBill } from "@repo/utils";
import { useCallback, useEffect } from "react";

import { useAsyncResource } from "@/hooks/use-async-resource";
import { fetchActiveTenancy, type ActiveTenancy } from "@/service/tenancyService";

export type { TenancyApartment, TenancyLandlord } from "@/service/tenancyService";

export type TenancyPayment = {
  billing_kind?: string | null;
  rent_amount?: number | null;
  advance_amount?: number | null;
  advance_period_start?: string | null;
  id: string;
  amount: number | null;
  status: string | null;
  date: string;
  due_date: string | null;
  period_start: string | null;
  period_end: string | null;
};

export type CurrentTenancy = ActiveTenancy & {
  bill?: TenancyBill | null;
};

interface TenancyFinanceData {
  bill: TenancyBill | null;
  payments: TenancyPayment[];
  /** Payments failed to load; the bill itself is still authoritative. */
  paymentError: string | null;
}

const EMPTY_FINANCE: TenancyFinanceData = {
  bill: null,
  payments: [],
  paymentError: null,
};

/**
 * Rental context only: identity, active tenancy, apartment and lease dates.
 * Bills and payment history are a separate resource so the authenticated
 * rental shell can render before the financial reads settle.
 *
 * Exported for direct unit coverage; the hook below is the only app caller.
 */
export async function fetchTenancyContext(): Promise<ActiveTenancy | null> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile, error: profileError } = await supabase
    .from("users")
    .select("id")
    .eq("user_id", user.id)
    .single();
  if (profileError || !profile) throw new Error(profileError?.message ?? "Profile not found");

  return fetchActiveTenancy(profile.id);
}

/**
 * Financial reads stay fresh and caller-bound on every load. They start only
 * once the active tenancy id is known, and are never cached as authoritative.
 *
 * Exported for direct unit coverage; the hook below is the only app caller.
 */
export async function fetchTenancyFinance(tenancyId: string | null): Promise<TenancyFinanceData> {
  if (!tenancyId) return EMPTY_FINANCE;

  const supabase = createClient();
  const [{ data: bill, error: billError }, { data: paymentRows, error: paymentError }] = await Promise.all([
    supabase.rpc("get_tenancy_bill", { p_tenancy_id: tenancyId }),
    supabase.from("payment")
      .select(
        "id, amount, status, date, due_date, period_start, period_end, billing_kind, rent_amount, advance_amount, advance_period_start",
      )
      .eq("tenancy_id", tenancyId)
      .order("period_start", { ascending: false })
      .order("date", { ascending: false })
      .limit(200),
  ]);
  if (billError) throw new Error(billError.message);

  if (paymentError) {
    console.error("[my-rental] Failed to load payment history:", paymentError);
  }

  return {
    bill: bill as unknown as TenancyBill | null,
    payments: (paymentRows ?? []) as TenancyPayment[],
    paymentError: paymentError?.message ?? null,
  };
}

// The payment with the latest period (like mobile's fetchTenancy): the rent
// status reuses its dates when it covers the month being billed.
function latestPeriodPayment(payments: TenancyPayment[]): TenancyPayment | null {
  return payments.reduce<TenancyPayment | null>(
    (latest, payment) =>
      (payment.period_start ?? "") > (latest?.period_start ?? "") ? payment : latest,
    payments[0] ?? null,
  );
}

export function useTenancy() {
  const context = useAsyncResource(
    fetchTenancyContext,
    null,
    "An unexpected error occurred.",
  );
  const tenancyId = context.error ? null : context.data?.id ?? null;

  const loadFinance = useCallback(
    () => fetchTenancyFinance(tenancyId),
    [tenancyId],
  );
  const finance = useAsyncResource(
    loadFinance,
    EMPTY_FINANCE,
    "Unable to load your rental balance.",
  );

  // Never pair a new tenancy (including a different account's) with the
  // previous financial snapshot while the new reads are still in flight.
  const financeReady = !finance.loading && !finance.error;
  const financeData = financeReady ? finance.data : EMPTY_FINANCE;
  const tenancy = context.error ? null : context.data;
  const financeLoading = tenancyId !== null && finance.loading;

  // Coming back to the tab re-reads the bill/payments so a landlord's
  // confirmation shows up, but silently: no skeleton flash, no takeover.
  const { revalidate: revalidateContext, refresh: refreshContext } = context;
  const { revalidate: revalidateFinance, refresh: refreshFinance } = finance;
  useEffect(() => {
    if (!tenancyId) return;
    const onFocus = () => {
      void revalidateContext();
      void revalidateFinance();
    };
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [tenancyId, revalidateContext, revalidateFinance]);

  const revalidate = useCallback(async () => {
    await Promise.all([revalidateContext(), revalidateFinance()]);
  }, [revalidateContext, revalidateFinance]);

  return {
    tenancy: tenancy
      ? ({ ...tenancy, bill: financeData.bill } as CurrentTenancy)
      : null,
    payments: financeData.payments,
    currentPayment: latestPeriodPayment(financeData.payments),
    loading: context.loading,
    error: context.error,
    /** The bill/payment reads are still settling for the current tenancy. */
    financeLoading,
    /** The bill failed; no authoritative balance can be shown. */
    financeError: finance.error,
    /** Payments failed while the bill loaded; history/schedule is unavailable. */
    paymentError: financeReady ? financeData.paymentError : null,
    /** Full retry for the context error screen. */
    refetch: refreshContext,
    /** Silent re-read after an acknowledged lease or tab focus. */
    revalidate,
    /** Localized retry for the rent card and payment history. */
    retryFinance: refreshFinance,
  };
}
