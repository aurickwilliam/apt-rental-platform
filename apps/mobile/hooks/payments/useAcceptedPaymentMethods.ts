import { useQuery } from "@tanstack/react-query";
import type { PaymentMethod } from "@repo/utils";
import { fetchAcceptedMethodsForTenancy } from "@/service/payments/acceptedMethodsService";

export const getAcceptedMethodsQueryKey = (userId: string | null, tenancyId: string | null) =>
  ["accepted-payment-methods", userId, tenancyId] as const;

const NO_METHODS: PaymentMethod[] = [];

// The methods this tenancy's landlord accepts. Nothing is offered until the list has loaded,
// and a failed read offers nothing (with a retry) rather than every method: the checkout never
// guesses what the landlord allows. The database and the paymongo function enforce it too.
export function useAcceptedPaymentMethods(userId: string | null, tenancyId: string | null) {
  const query = useQuery({
    queryKey: getAcceptedMethodsQueryKey(userId, tenancyId),
    queryFn: ({ signal }) => fetchAcceptedMethodsForTenancy(tenancyId as string, signal),
    enabled: userId !== null && tenancyId !== null,
  });
  return {
    acceptedMethods: query.data ?? NO_METHODS,
    loading: query.isLoading,
    error: query.error ? "Couldn't load the payment methods your landlord accepts. Please try again." : null,
    refetch: query.refetch,
  };
}
