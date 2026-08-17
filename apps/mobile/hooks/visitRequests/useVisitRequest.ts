import { useQuery } from "@tanstack/react-query";
import { useProfile } from "hooks/auth";

import { fetchVisitRequest } from "@/service/visitRequests/visitRequestsService";

export type { VisitRequest } from "@/service/visitRequests/visitRequestsService";

export const getVisitRequestQueryKey = (
  applicationId: string | undefined,
  tenantId: string | null
) => ["visit-request", applicationId, tenantId] as const;

export function useVisitRequest(applicationId: string | undefined) {
  const { profile } = useProfile();
  const tenantId = profile?.id ?? null;

  const visitRequestQuery = useQuery({
    queryKey: getVisitRequestQueryKey(applicationId, tenantId),
    queryFn: () => fetchVisitRequest(applicationId as string, tenantId as string),
    enabled: applicationId !== undefined && tenantId !== null,
  });

  return {
    visitRequest: visitRequestQuery.data?.current ?? null,
    history: visitRequestQuery.data?.history ?? [],
    loading: visitRequestQuery.isLoading,
    refetch: visitRequestQuery.refetch,
  };
}