"use client";

import { useCallback } from "react";

import { useAsyncResource } from "@/hooks/use-async-resource";
import {
  fetchLandlordVisitRequests,
  type LandlordVisitRequest,
} from "@/service/landlordVisitRequestsService";

export type { LandlordVisitRequest };

const NO_VISIT_REQUESTS: LandlordVisitRequest[] = [];

export function useLandlordVisitRequests() {
  const load = useCallback(() => fetchLandlordVisitRequests(), []);
  const { data, loading, error, refresh } = useAsyncResource(load, NO_VISIT_REQUESTS, "Failed to load visit requests.");

  return { visitRequests: data, loading, error, refetch: refresh };
}
