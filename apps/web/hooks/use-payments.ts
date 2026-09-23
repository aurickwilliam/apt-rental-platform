"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  fetchPaymentById,
  fetchPaymentByReferenceId,
  fetchPayments,
  type PaymentRecord,
} from "@/service/paymentService";

export type { PaymentRecord };

function toMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return "An unexpected error occurred.";
}

type QueryResult<T> = {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
};

function useQueryOnce<T>(key: string | null, fetcher: (key: string) => Promise<T>): QueryResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(key !== null);
  const [error, setError] = useState<string | null>(null);
  const fetcherRef = useRef(fetcher);

  useEffect(() => {
    fetcherRef.current = fetcher;
  }, [fetcher]);

  const refetch = useCallback(async () => {
    if (key === null) return;
    const activeKey = key;
    setLoading(true);
    setError(null);
    try {
      setData(await fetcherRef.current(activeKey));
    } catch (err) {
      setError(toMessage(err));
    } finally {
      setLoading(false);
    }
  }, [key]);

  useEffect(() => {
    if (key === null) return;
    let cancelled = false;
    queueMicrotask(() => {
      if (!cancelled) void refetch();
    });
    return () => {
      cancelled = true;
    };
  }, [key, refetch]);

  if (key === null) {
    return { data: null, loading: false, error: null, refetch };
  }
  return { data, loading, error, refetch };
}

export function usePayments(tenancyId: string | null): QueryResult<PaymentRecord[]> {
  return useQueryOnce<PaymentRecord[]>(tenancyId, (id) => fetchPayments(id));
}

export function usePayment(paymentId: string | null): QueryResult<PaymentRecord | null> {
  return useQueryOnce<PaymentRecord | null>(paymentId, (id) => fetchPaymentById(id));
}

export function usePaymentByReference(
  referenceId: string | null,
  options?: { pollWhilePending?: boolean },
): QueryResult<PaymentRecord | null> {
  const result = useQueryOnce<PaymentRecord | null>(referenceId, (ref) => fetchPaymentByReferenceId(ref));

  // Mobile parity: e-wallet/card rows flip fast so poll briefly once pending.
  // Cash rows stay pending until landlord confirms — never poll those.
  useEffect(() => {
    if (!options?.pollWhilePending || !referenceId) return;
    if (result.data?.status !== "pending" || result.data?.method === "cash") return;
    const timer = setInterval(() => {
      void result.refetch();
    }, 3000);
    return () => clearInterval(timer);
  }, [options?.pollWhilePending, referenceId, result.data, result.refetch]);

  return result;
}
