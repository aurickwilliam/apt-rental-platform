import { useCallback, useEffect } from "react";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { supabase } from "@repo/supabase";

import { useCurrentUser } from "@/hooks/auth";
import { fetchTenancy } from "@/service/tenancyService";

export type {
  CurrentTenancy,
  TenancyApartment,
  TenancyLandlord,
  TenancyPayment,
} from "@/service/tenancyService";

export const getTenancyQueryKey = (tenantId: string) =>
  ["tenancy", tenantId] as const;

function getErrorMessage(error: unknown): string | null {
  if (!error) return null;
  if (error instanceof Error) return error.message;

  if (
    typeof error === "object" &&
    "message" in error &&
    typeof (error as { message?: unknown }).message === "string"
  ) {
    return (error as { message: string }).message;
  }

  return "An unexpected error occurred.";
}

function getRecordString(record: unknown, field: string): string | null {
  if (typeof record !== "object" || record === null) return null;

  const value = (record as Record<string, unknown>)[field];
  return typeof value === "string" ? value : null;
}

export function useTenancy() {
  const queryClient = useQueryClient();
  const currentUserQuery = useCurrentUser();
  const tenantId = currentUserQuery.data?.id ?? null;

  const tenancyQuery = useQuery({
    queryKey: ["tenancy", tenantId] as const,
    queryFn: () => fetchTenancy(tenantId as string),
    enabled: tenantId !== null,
  });

  const tenancy = tenancyQuery.data ?? null;

  const refetch = useCallback(async () => {
    if (!tenantId) return;

    await tenancyQuery.refetch();
  }, [tenancyQuery, tenantId]);

  useEffect(() => {
    if (!tenantId) return;

    const queryKey = getTenancyQueryKey(tenantId);
    const channel = supabase
      .channel(`tenancy-live:${tenantId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "tenancies",
          filter: `tenant_id=eq.${tenantId}`,
        },
        (payload) => {
          const record = payload.new ?? payload.old;
          if (getRecordString(record, "tenant_id") === tenantId) {
            void queryClient.invalidateQueries({ queryKey, exact: true });
          }
        },
      );

    if (tenancy?.id) {
      channel.on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "payment",
          filter: `tenancy_id=eq.${tenancy.id}`,
        },
        (payload) => {
          const record = payload.new ?? payload.old;
          if (getRecordString(record, "tenancy_id") === tenancy.id) {
            void queryClient.invalidateQueries({ queryKey, exact: true });
          }
        },
      );
    }

    channel.subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [queryClient, tenantId, tenancy?.id]);

  return {
    tenancy,
    loading: currentUserQuery.isLoading || tenancyQuery.isLoading,
    error: getErrorMessage(currentUserQuery.error ?? tenancyQuery.error),
    refetch,
  };
}
