"use client";

import { useCallback } from "react";

import { useAsyncResource } from "@/hooks/use-async-resource";
import { useAuthIdentity } from "@/hooks/use-auth-identity";
import { matchesPresentationSeed, type PresentationSeed } from "@/service/presentation-seed";
import {
  fetchLandlordVisitRequests,
  type LandlordVisitRequest,
} from "@/service/landlordVisitRequestsService";

export type { LandlordVisitRequest };

const NO_VISIT_REQUESTS: LandlordVisitRequest[] = [];

export function useLandlordVisitRequests(resourceId?: string, initial?: PresentationSeed<LandlordVisitRequest[]>) {
  const identity = useAuthIdentity(initial?.authUserId);
  const seed = matchesPresentationSeed(initial, identity, resourceId) ? initial : undefined;
  const load = useCallback(async () => {
    if (!identity.authUserId) return NO_VISIT_REQUESTS;
    const requests = await fetchLandlordVisitRequests(resourceId);
    if (!resourceId) return requests;
    const scoped = requests.filter((request) => request.id === resourceId);
    if (scoped.length === 0) throw new Error("This visit request is no longer available.");
    return scoped;
  }, [identity, resourceId]);
  const { data, loading, error, refresh, revalidate, revalidating } = useAsyncResource(load, NO_VISIT_REQUESTS, "Failed to load visit requests.", { initial: seed, clearOnRevalidateError: true });

  return { visitRequests: !loading && !error && identity.authUserId ? data : NO_VISIT_REQUESTS, loading: identity.authUserId === undefined || loading, error, refetch: refresh, revalidate, revalidating };
}
