"use client";

import { useCallback, useEffect, useState } from "react";

import { getTenantContext } from "@/service/favoritesService";
import {
  fetchVisitRequest,
  type VisitRequest,
} from "@/service/visitRequestsService";

export type { VisitRequest };

export function useVisitRequest(applicationId: string | undefined) {
  const [visitRequest, setVisitRequest] = useState<VisitRequest | null>(null);
  const [history, setHistory] = useState<VisitRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    if (!applicationId) {
      setVisitRequest(null);
      setHistory([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const context = await getTenantContext();
      if (!context.tenantId) {
        setVisitRequest(null);
        setHistory([]);
        return;
      }
      const result = await fetchVisitRequest(applicationId, context.tenantId);
      setVisitRequest(result.current);
      setHistory(result.history);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load visit request.");
    } finally {
      setLoading(false);
    }
  }, [applicationId]);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  return { visitRequest, history, loading, error, refetch };
}
