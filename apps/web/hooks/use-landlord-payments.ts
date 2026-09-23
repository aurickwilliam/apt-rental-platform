"use client";

import { useCallback, useEffect, useState } from "react";
import {
  fetchLandlordApartments,
  fetchLandlordPaymentById,
  fetchLandlordPayments,
  updateLandlordPaymentStatus,
  type LandlordApartment,
  type PaymentRecord,
} from "@/service/landlordPaymentService";

export type { LandlordApartment, PaymentRecord };

function toMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
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
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [loading, setLoading] = useState(apartmentId !== null);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!apartmentId) return;
    const activeId = apartmentId;
    setLoading(true);
    setError(null);
    try {
      setPayments(await fetchLandlordPayments(activeId));
    } catch (err) {
      setError(toMessage(err));
    } finally {
      setLoading(false);
    }
  }, [apartmentId]);

  useEffect(() => {
    let cancelled = false;
    queueMicrotask(() => {
      if (cancelled) return;
      if (!apartmentId) {
        setPayments([]);
        setLoading(false);
        setError(null);
        return;
      }
      void refresh();
    });
    return () => {
      cancelled = true;
    };
  }, [apartmentId, refresh]);

  const applyOptimisticPaid = useCallback((paymentId: string) => {
    setPayments((rows) => rows.map((row) => (row.id === paymentId ? { ...row, status: "paid" } : row)));
  }, []);

  const rollback = useCallback((previous: PaymentRecord[]) => {
    setPayments(previous);
  }, []);

  if (!apartmentId) {
    return { payments: [], loading: false, error: null, refresh, applyOptimisticPaid, rollback };
  }
  return { payments, loading, error, refresh, applyOptimisticPaid, rollback };
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

// Landlord confirms pending cash → paid. Optimistic flip with rollback; settles
// mark-stale only (no extra refetch) — the notification trigger is the signal.
export function useLandlordPaymentConfirmation() {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const confirm = useCallback(async (paymentId: string): Promise<boolean> => {
    setPending(true);
    setError(null);
    const result = await updateLandlordPaymentStatus(paymentId);
    setPending(false);
    if (!result.success) {
      setError(result.error ?? "Could not update payment status.");
      return false;
    }
    return true;
  }, []);

  const clearError = useCallback(() => setError(null), []);

  return { confirm, pending, error, clearError };
}
