"use client";

import { useCallback } from "react";

import { useAsyncResource } from "@/hooks/use-async-resource";
import {
  fetchTenantApplications,
  type TenantApplication,
} from "@/service/tenantApplicationsService";
import { getTenantContext } from "@/service/favoritesService";

export type { TenantApplication };

interface TenantApplicationsData {
  tenantId: string | null;
  applications: TenantApplication[];
}

const EMPTY: TenantApplicationsData = { tenantId: null, applications: [] };

export function useTenantApplications() {
  const load = useCallback(async (): Promise<TenantApplicationsData> => {
    const context = await getTenantContext();
    if (!context.tenantId) return EMPTY;
    return { tenantId: context.tenantId, applications: await fetchTenantApplications(context.tenantId) };
  }, []);
  const { data, loading, error, refresh } = useAsyncResource(load, EMPTY, "Failed to load applications.");

  return { applications: data.applications, tenantId: data.tenantId, loading, error, refresh };
}
