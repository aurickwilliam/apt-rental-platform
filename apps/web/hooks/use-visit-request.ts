"use client";

import { useCallback, useMemo, useRef } from "react";

import { useAsyncResource } from "@/hooks/use-async-resource";
import { useAuthIdentity } from "@/hooks/use-auth-identity";
import { matchesPresentationSeed, type PresentationSeed } from "@/service/presentation-seed";
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

export function useVisitRequest(applicationId: string | undefined, initial?: PresentationSeed<VisitRequestData>) {
  const identity = useAuthIdentity(initial?.authUserId);
  const seed = matchesPresentationSeed(initial, identity, applicationId) ? initial : undefined;
  const scope = useMemo(() => ({ applicationId, identity }), [applicationId, identity]);
  const seenVisits = useRef(new WeakSet<object>());
  const load = useCallback(async (): Promise<VisitRequestData> => {
    if (!applicationId || !identity.authUserId) return EMPTY;
    const context = await getTenantContext();
    const result = context.tenantId ? await fetchVisitRequest(applicationId, context.tenantId) : EMPTY;
    // Initial absence is valid; disappearance after a scoped read is not proof
    // that a new request may be made. Retain only a weak scope marker, no data.
    if ((seenVisits.current.has(scope) || seed?.data.current) && !result.current) throw new Error("This visit request is no longer available.");
    if (result.current) seenVisits.current.add(scope);
    return result;
  }, [applicationId, identity, scope, seed]);
  const { data, loading, error, refresh, revalidate, revalidating } = useAsyncResource(load, EMPTY, "Failed to load visit request.", { initial: seed, clearOnRevalidateError: true });
  const visible = !loading && !error && identity.authUserId ? data : EMPTY;

  return { visitRequest: visible.current, history: visible.history, loading: identity.authUserId === undefined || loading, error, refetch: refresh, revalidate, revalidating };
}
