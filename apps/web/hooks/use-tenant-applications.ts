"use client";

import { useCallback } from "react";

import { useAsyncResource } from "@/hooks/use-async-resource";
import {
  fetchTenantApplications,
  type TenantApplication,
} from "@/service/tenantApplicationsService";
import { getTenantContext } from "@/service/favoritesService";
import type { PresentationSeed } from "@/service/presentation-seed";

export type { TenantApplication };

interface TenantApplicationsData {
  tenantId: string | null;
  applications: TenantApplication[];
}

const EMPTY: TenantApplicationsData = { tenantId: null, applications: [] };

export function useTenantApplications(knownTenantId?: string, applicationId?: string, includeDocuments = !!applicationId, initial?: PresentationSeed<TenantApplication[]>) {
  const load = useCallback(async (): Promise<TenantApplicationsData> => {
    const tenantId = knownTenantId ?? (await getTenantContext()).tenantId;
    if (!tenantId) return EMPTY;
    return { tenantId, applications: await fetchTenantApplications(tenantId, { applicationId, includeDocuments }) };
  }, [knownTenantId, applicationId, includeDocuments]);
  const { data, loading, error, refresh } = useAsyncResource(load, EMPTY, "Failed to load applications.", {
    initial: initial && initial.profileId === knownTenantId && initial.resourceId === applicationId
      ? { data: { tenantId: knownTenantId ?? null, applications: initial.data }, error: initial.error } : undefined,
    clearOnRevalidateError: true,
  });

  const visible = loading || error ? EMPTY : data;
  return { applications: visible.applications, tenantId: visible.tenantId, loading, error, refresh };
}
