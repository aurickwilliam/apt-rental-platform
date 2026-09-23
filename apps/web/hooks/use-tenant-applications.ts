"use client";

import { useCallback, useEffect, useState } from "react";

import {
  fetchTenantApplications,
  type TenantApplication,
} from "@/service/tenantApplicationsService";
import { getTenantContext } from "@/service/favoritesService";

export type { TenantApplication };

export function useTenantApplications() {
  const [applications, setApplications] = useState<TenantApplication[]>([]);
  const [tenantId, setTenantId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const context = await getTenantContext();
      if (!context.tenantId) {
        setTenantId(null);
        setApplications([]);
        return;
      }
      setTenantId(context.tenantId);
      const rows = await fetchTenantApplications(context.tenantId);
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

  return { applications, tenantId, loading, error, refresh };
}
