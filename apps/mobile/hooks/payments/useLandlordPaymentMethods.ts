import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { PAYMENT_METHOD_TYPES, type PaymentMethod } from "@repo/utils";
import { fetchLandlordAcceptedMethods, saveLandlordAcceptedMethods } from "@/service/payments/acceptedMethodsService";

export const getLandlordPaymentMethodsQueryKey = (landlordId: string | null) =>
  ["landlord-payment-methods", landlordId] as const;

// The landlord's own accepted-methods setting, keyed by their account.
export function useLandlordPaymentMethods(landlordId: string | null) {
  const client = useQueryClient();
  const key = getLandlordPaymentMethodsQueryKey(landlordId);
  const query = useQuery({
    queryKey: key,
    queryFn: ({ signal }) => fetchLandlordAcceptedMethods(landlordId as string, signal),
    enabled: landlordId !== null,
  });
  const mutation = useMutation({
    mutationFn: (methods: readonly PaymentMethod[]) => {
      if (!landlordId) throw new Error("Please sign in to save payment methods.");
      return saveLandlordAcceptedMethods(landlordId, methods);
    },
    // The write returns the canonical list, so no extra read is needed.
    onSuccess: (saved) => client.setQueryData(key, saved),
  });

  return {
    acceptedMethods: query.data ?? ([...PAYMENT_METHOD_TYPES] as PaymentMethod[]),
    hasLoaded: query.data !== undefined,
    loading: query.isLoading,
    error: query.error ? "Couldn't load your payment methods. Please try again." : null,
    refetch: query.refetch,
    isSaving: mutation.isPending,
    save: mutation.mutateAsync,
  };
}
