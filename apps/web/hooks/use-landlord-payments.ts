"use client";

import { useCallback, useState } from "react";
import { useAsyncResource } from "@/hooks/use-async-resource";
import { useAuthIdentity } from "@/hooks/use-auth-identity";
import {
  ALL_APARTMENTS,
  fetchAllLandlordPayments,
  fetchLandlordApartments,
  fetchLandlordPaymentById,
  fetchLandlordPayments,
  updateLandlordPaymentStatus,
  type LandlordApartment,
  type LandlordPaymentRecord,
  type PaymentRecord,
} from "@/service/landlordPaymentService";

export type { LandlordApartment, LandlordPaymentRecord, PaymentRecord };

const NO_PAYMENTS: LandlordPaymentRecord[] = [];
const NO_APARTMENTS: LandlordApartment[] = [];

function toMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === "object" && error !== null) {
    const e = error as { message?: unknown; code?: unknown; details?: unknown; hint?: unknown };
    const parts = [e.message, e.code ? `(code ${String(e.code)})` : "", e.details ? String(e.details) : "", e.hint ? `Hint: ${String(e.hint)}` : ""].filter(
      (p): p is string => typeof p === "string" && p.length > 0,
    );
    if (parts.length > 0) return parts.join(" ");
  }
  return "Failed to load payments.";
}

export function useLandlordApartments() {
  const identity = useAuthIdentity();
  const load = useCallback(() => identity.authUserId ? fetchLandlordApartments() : Promise.resolve(NO_APARTMENTS), [identity]);
  const resource = useAsyncResource(load, NO_APARTMENTS, "Failed to load units.", { clearOnRevalidateError: true });
  return {
    apartments: resource.loading || resource.error ? NO_APARTMENTS : resource.data,
    loading: identity.authUserId === undefined || resource.loading,
    error: resource.error,
    revalidating: resource.revalidating,
    refresh: resource.revalidate,
  };
}

export function useLandlordPayments(apartmentId: string | null) {
  const identity = useAuthIdentity();
  const load = useCallback(async () => {
    if (!apartmentId || !identity.authUserId) return NO_PAYMENTS;
    try {
      return apartmentId === ALL_APARTMENTS ? await fetchAllLandlordPayments() : await fetchLandlordPayments(apartmentId);
    } catch (err) {
      throw new Error(toMessage(err));
    }
  }, [apartmentId, identity]);
  const { data, loading, error, revalidate, revalidating, setData } = useAsyncResource(load, NO_PAYMENTS, "Failed to load payments.", { clearOnRevalidateError: true });

  const applyOptimisticPaid = useCallback((paymentId: string) => {
    setData((rows) => rows.map((row) => (row.id === paymentId ? { ...row, status: "paid" } : row)));
  }, [setData]);

  const rollback = useCallback((previous: LandlordPaymentRecord[]) => {
    setData(previous);
  }, [setData]);

  // A unit change is loading immediately, before its effect runs. Never expose
  // the preceding unit's rows (including after the new unit's request fails).
  return {
    payments: apartmentId && !loading && !error ? data : NO_PAYMENTS,
    loading: apartmentId !== null && (identity.authUserId === undefined || loading),
    error: apartmentId ? error : null,
    refresh: revalidate,
    revalidating,
    applyOptimisticPaid,
    rollback,
  };
}

export function useLandlordPayment(paymentId: string | null) {
  const identity = useAuthIdentity();
  const load = useCallback(async (): Promise<PaymentRecord | null> => {
    if (!paymentId || !identity.authUserId) return null;
    try {
      const payment = await fetchLandlordPaymentById(paymentId);
      if (!payment) throw new Error("This receipt is no longer available.");
      return payment;
    } catch (err) {
      throw new Error(toMessage(err));
    }
  }, [paymentId, identity]);
  const resource = useAsyncResource(load, null, "Failed to load receipt.", { clearOnRevalidateError: true });
  return {
    payment: paymentId && identity.authUserId && !resource.loading && !resource.error ? resource.data : null,
    loading: paymentId !== null && (identity.authUserId === undefined || resource.loading),
    error: paymentId ? resource.error : null,
    refetch: resource.refresh,
    revalidate: resource.revalidate,
    revalidating: resource.revalidating,
  };
}

// Landlord resolves pending cash → paid or rejected. Rejected cash may be
// resubmitted by the tenant for the same billing period.
export function useLandlordPaymentConfirmation() {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const confirm = useCallback(async (paymentId: string): Promise<boolean> => {
    setPending(true);
    setError(null);
      const result = await updateLandlordPaymentStatus(paymentId, "paid");
    setPending(false);
    if (!result.success) {
      setError(result.error ?? "Could not update payment status.");
      return false;
    }
    return true;
  }, []);

  const reject = useCallback(async (paymentId: string): Promise<boolean> => {
    setPending(true);
    setError(null);
    const result = await updateLandlordPaymentStatus(paymentId, "rejected");
    setPending(false);
    if (!result.success) {
      setError(result.error ?? "Could not reject payment.");
      return false;
    }
    return true;
  }, []);

  const clearError = useCallback(() => setError(null), []);

  return { confirm, reject, pending, error, clearError };
}
