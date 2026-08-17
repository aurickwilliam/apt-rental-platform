import { useQuery } from '@tanstack/react-query';

import { fetchLandlordTenancy } from '@/service/landlord/landlordService';

export type {
  LandlordTenant,
  LandlordTenancyMaintenanceRequest as MaintenanceRequest,
  PaymentRecord,
} from '@/service/landlord/landlordService';

export const getLandlordTenancyQueryKey = (apartmentId: string | undefined) =>
  ['landlord-tenancy', apartmentId] as const;

export function useLandlordTenancy(apartmentId: string | undefined) {
  const tenancyQuery = useQuery({
    queryKey: getLandlordTenancyQueryKey(apartmentId),
    queryFn: () => fetchLandlordTenancy(apartmentId as string),
    enabled: apartmentId !== undefined,
  });

  return {
    tenant: tenancyQuery.data?.tenant ?? null,
    maintenanceRequest: tenancyQuery.data?.maintenanceRequest ?? null,
    paymentHistory: tenancyQuery.data?.paymentHistory ?? [],
    loading: tenancyQuery.isLoading,
    refetch: () => tenancyQuery.refetch(),
  };
}