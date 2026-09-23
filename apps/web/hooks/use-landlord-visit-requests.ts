"use client";

import { useCallback, useEffect, useState } from "react";

import {
  fetchLandlordVisitRequests,
  type LandlordVisitRequest,
} from "@/service/landlordVisitRequestsService";

export type { LandlordVisitRequest };

export function useLandlordVisitRequests() {
  const [visitRequests, setVisitRequests] = useState<LandlordVisitRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setVisitRequests(await fetchLandlordVisitRequests());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load visit requests.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  return { visitRequests, loading, error, refetch };
}
