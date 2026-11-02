import { useQuery } from "@tanstack/react-query";
import { PAYMENT_METHOD_TYPES, type PaymentMethod } from "@repo/utils";
import { fetchAcceptedMethodsForTenancy } from "@/service/payments/acceptedMethodsService";

export const getAcceptedMethodsQueryKey = (userId: string | null, tenancyId: string | null) =>
  ["accepted-payment-methods", userId, tenancyId] as const;

// The methods this tenancy's landlord accepts. While loading, or if the read fails,
// every method is listed: the database still refuses a method the landlord turned off,
// and its message is shown as-is.
export function useAcceptedPaymentMethods(userId: string | null, tenancyId: string | null) {
  const query = useQuery({
    queryKey: getAcceptedMethodsQueryKey(userId, tenancyId),
    queryFn: ({ signal }) => fetchAcceptedMethodsForTenancy(tenancyId as string, signal),
    enabled: userId !== null && tenancyId !== null,
  });
  return {
    acceptedMethods: query.data ?? [...PAYMENT_METHOD_TYPES] as PaymentMethod[],
    loading: query.isLoading,
  };
}
