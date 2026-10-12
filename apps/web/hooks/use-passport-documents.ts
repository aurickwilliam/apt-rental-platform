"use client";

import { useCallback, useEffect, useState } from "react";

import {
  fetchPassportDocumentsWithVerification,
  type PassportDocumentRow,
} from "@/service/passportService";

export type { PassportDocumentRow };

/**
 * The signed-in user's APT Passport wallet. The approved verification ID is
 * linked inside the same read, so `loading` stays true until the wallet is
 * authoritative and the empty state never flashes before the ID lands.
 */
export function usePassportDocuments(userId: string) {
  const [documents, setDocuments] = useState<PassportDocumentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [requestKey, setRequestKey] = useState(0);

  useEffect(() => {
    let cancelled = false;

    fetchPassportDocumentsWithVerification(userId)
      .then((rows) => {
        if (cancelled) return;
        setDocuments(rows);
        setError(null);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        console.error("Failed to load APT Passport documents", err);
        setError(err instanceof Error ? err.message : "Couldn't load your documents.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [userId, requestKey]);

  const refresh = useCallback(() => {
    setLoading(true);
    setError(null);
    setRequestKey((key) => key + 1);
  }, []);

  /** Swaps in a row returned by a mutation without another round trip. */
  const replaceDocument = useCallback((row: PassportDocumentRow) => {
    setDocuments((current) => current.map((doc) => (doc.id === row.id ? row : doc)));
  }, []);

  /** Prepends a newly uploaded row (the wallet is ordered newest first). */
  const addDocument = useCallback((row: PassportDocumentRow) => {
    setDocuments((current) => [row, ...current.filter((doc) => doc.id !== row.id)]);
  }, []);

  return { documents, loading, error, refresh, replaceDocument, addDocument };
}
