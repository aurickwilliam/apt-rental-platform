"use client";

import { useCallback, useEffect, useState } from "react";
import { useAsyncResource } from "@/hooks/use-async-resource";
import {
  fetchLandlordApartments,
  fetchLandlordPaymentById,
  fetchLandlordPayments,
  updateLandlordPaymentStatus,
  type LandlordApartment,
  type PaymentRecord,
} from "@/service/landlordPaymentService";

export type { LandlordApartment, PaymentRecord };

const NO_PAYMENTS: PaymentRecord[] = [];

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
  const [apartments, setApartments] = useState<LandlordApartment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setApartments(await fetchLandlordApartments());
    } catch (err) {
      setError(toMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    queueMicrotask(() => {
      if (!cancelled) void refresh();
    });
    return () => {
      cancelled = true;
    };
  }, [refresh]);

  return { apartments, loading, error, refresh };
}

export function useLandlordPayments(apartmentId: string | null) {
  const load = useCallback(async () => {
    if (!apartmentId) return NO_PAYMENTS;
    try {
      return await fetchLandlordPayments(apartmentId);
    } catch (err) {
      throw new Error(toMessage(err));
    }
  }, [apartmentId]);
  const { data, loading, error, refresh, setData } = useAsyncResource(load, NO_PAYMENTS, "Failed to load payments.");

  const applyOptimisticPaid = useCallback((paymentId: string) => {
    setData((rows) => rows.map((row) => (row.id === paymentId ? { ...row, status: "paid" } : row)));
  }, [setData]);

  const rollback = useCallback((previous: PaymentRecord[]) => {
    setData(previous);
  }, [setData]);

  // A unit change is loading immediately, before its effect runs. Never expose
  // the preceding unit's rows (including after the new unit's request fails).
  return {
    payments: apartmentId && !loading && !error ? data : NO_PAYMENTS,
    loading: apartmentId !== null && loading,
    error: apartmentId ? error : null,
    refresh,
    applyOptimisticPaid,
    rollback,
  };
}

export function useLandlordPayment(paymentId: string | null) {
  const [payment, setPayment] = useState<PaymentRecord | null>(null);
  const [loading, setLoading] = useState(paymentId !== null);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    if (!paymentId) return;
    setLoading(true);
    setError(null);
    try {
      setPayment(await fetchLandlordPaymentById(paymentId));
    } catch (err) {
      setError(toMessage(err));
    } finally {
      setLoading(false);
    }
  }, [paymentId]);

  useEffect(() => {
    let cancelled = false;
    queueMicrotask(() => {
      if (cancelled) return;
      if (!paymentId) {
        setPayment(null);
        setLoading(false);
        return;
      }
      void refetch();
    });
    return () => {
      cancelled = true;
    };
  }, [paymentId, refetch]);

  if (!paymentId) {
    return { payment: null, loading: false, error: null, refetch };
  }
  return { payment, loading, error, refetch };
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
