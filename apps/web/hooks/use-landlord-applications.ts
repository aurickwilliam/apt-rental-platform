"use client";

import { useCallback, useEffect, useState } from "react";

import {
  fetchLandlordApplications,
  getLandlordContext,
  type LandlordApplication,
} from "@/service/landlordApplicationsService";

export type { LandlordApplication };
export type DisplayStatus = LandlordApplication["status"];

export function useLandlordApplications() {
  const [applications, setApplications] = useState<LandlordApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const context = await getLandlordContext();
      if (!context.landlordId) {
        setApplications([]);
        return;
      }
      const rows = await fetchLandlordApplications();
      setApplications(rows);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load applications.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { applications, loading, error, refresh };
}
