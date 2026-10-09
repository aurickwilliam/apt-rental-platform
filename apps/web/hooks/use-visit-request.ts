"use client";

import { useCallback } from "react";

import { useAsyncResource } from "@/hooks/use-async-resource";
import { getTenantContext } from "@/service/favoritesService";
import {
  fetchVisitRequest,
  type VisitRequest,
} from "@/service/visitRequestsService";

export type { VisitRequest };

interface VisitRequestData {
  current: VisitRequest | null;
  history: VisitRequest[];
}

const EMPTY: VisitRequestData = { current: null, history: [] };

export function useVisitRequest(applicationId: string | undefined) {
  const load = useCallback(async (): Promise<VisitRequestData> => {
    if (!applicationId) return EMPTY;
    const context = await getTenantContext();
    if (!context.tenantId) return EMPTY;
    return fetchVisitRequest(applicationId, context.tenantId);
  }, [applicationId]);
  const { data, loading, error, refresh } = useAsyncResource(load, EMPTY, "Failed to load visit request.");

  return { visitRequest: data.current, history: data.history, loading, error, refetch: refresh };
}
