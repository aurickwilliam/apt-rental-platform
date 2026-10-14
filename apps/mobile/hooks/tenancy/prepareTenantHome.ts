import type { QueryClient, QueryKey } from "@tanstack/react-query";

import { fetchTenancy } from "@/service/tenancy/tenancyService";
import { fetchTenantApplications } from "@/service/applications/tenantApplicationsService";
import { fetchLatestMaintenanceRequest } from "@/service/maintenance-requests/maintenanceService";
import { fetchPayments } from "@/service/payments/paymentService";
import { getTenantApplicationsQueryKey } from "@/hooks/applications/useTenantApplications";
import { getLatestMaintenanceRequestQueryKey } from "@/hooks/maintenance-requests/useMaintenanceRequests";
import { getPaymentsQueryKey } from "@/hooks/payments/usePayments";

import { getTenancyQueryKey } from "./useTenancy";
import { prefetchRentalsLayoutHint } from "./useRentalsLayoutHint";

// A failed prefetch is reset rather than left as an error, so the screen makes
// its own attempt behind the skeleton and only shows the error state if that
// attempt fails too (an errored query would show the error while retrying).
async function prefetchOrReset<T>(
  queryClient: QueryClient,
  queryKey: QueryKey,
  queryFn: () => Promise<T>,
): Promise<T | undefined> {
  try {
    return await queryClient.fetchQuery({ queryKey, queryFn });
  } catch {
    await queryClient.resetQueries({ queryKey, exact: true });
    return undefined;
  }
}

// Starts loading everything the Rentals tab shows, under the same query keys
// its hooks use, so the screen picks up requests that are already in flight.
async function prefetchRentalsData(queryClient: QueryClient, tenantId: string): Promise<void> {
  const [tenancy] = await Promise.all([
    prefetchOrReset(queryClient, getTenancyQueryKey(tenantId), () => fetchTenancy(tenantId)),
    prefetchOrReset(queryClient, getTenantApplicationsQueryKey(tenantId), () =>
      fetchTenantApplications(tenantId),
    ),
  ]);
  if (!tenancy) return;

  const apartmentId = tenancy.apartment.id;
  await Promise.all([
    prefetchOrReset(queryClient, getLatestMaintenanceRequestQueryKey(apartmentId), () =>
      fetchLatestMaintenanceRequest(apartmentId),
    ),
    prefetchOrReset(queryClient, getPaymentsQueryKey(tenancy.id), () => fetchPayments(tenancy.id)),
  ]);
}

/**
 * Called during app boot once the tenant portal is chosen: waits only for the
 * on-device layout hint (one storage read) and leaves the data loading in the
 * background so the splash isn't held for the network.
 */
export async function prepareTenantHome(
  queryClient: QueryClient,
  authUserId: string,
  tenantId: string,
): Promise<void> {
  void prefetchRentalsData(queryClient, tenantId);
  await prefetchRentalsLayoutHint(queryClient, authUserId);
}
