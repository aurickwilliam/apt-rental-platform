import { useCallback, useEffect, useRef } from "react";
import { useIsMutating, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useFocusEffect } from "expo-router";
import { EMPTY_PAYMENT_METHOD_PREFERENCES, type PaymentMethodPreference } from "@repo/utils";
import { fetchPaymentMethodPreferences, savePaymentMethodPreferences } from "@/service/payments/paymentPreferencesService";

export const getPaymentMethodPreferencesQueryKey = (userId: string | null) => ["payment-method-preferences", userId] as const;

export function usePaymentMethodPreferences(userId: string | null) {
  const client = useQueryClient();
  const identity = useRef({ userId, generation: 0 });
  if (identity.current.userId !== userId) {
    identity.current = { userId, generation: identity.current.generation + 1 };
  }
  useEffect(() => () => { identity.current.generation += 1; }, []);

  const key = getPaymentMethodPreferencesQueryKey(userId);
  const query = useQuery({
    queryKey: key,
    queryFn: ({ signal }) => {
      if (!userId) throw new Error("Please sign in to load payment preferences.");
      return fetchPaymentMethodPreferences(userId, signal);
    },
    enabled: userId !== null,
  });

  useFocusEffect(useCallback(() => {
    if (!userId) return;
    // Reuse fresh data and in-flight reads. A stale revisit also picks up Web edits.
    void client.refetchQueries({ queryKey: getPaymentMethodPreferencesQueryKey(userId), exact: true, type: "active", stale: true }, { cancelRefetch: false });
  }, [client, userId]));

  const mutation = useMutation({
    mutationKey: key,
    gcTime: 0,
    mutationFn: async (input: { userId: string; generation: number; preferences: PaymentMethodPreference }) => {
      if (identity.current.userId !== input.userId || identity.current.generation !== input.generation) {
        throw new Error("Your account changed. Reopen payment preferences.");
      }
      return savePaymentMethodPreferences(input.userId, input.preferences);
    },
    onMutate: async (input) => {
      const queryKey = getPaymentMethodPreferencesQueryKey(input.userId);
      const target = client.getQueryCache().find({ queryKey, exact: true });
      await client.cancelQueries({ queryKey, exact: true });
      return { target };
    },
    onSuccess: (saved, input, context) => {
      const queryKey = getPaymentMethodPreferencesQueryKey(input.userId);
      if (identity.current.userId !== input.userId || identity.current.generation !== input.generation
        || !context?.target || client.getQueryCache().find({ queryKey, exact: true }) !== context.target) return;
      // The write returns the canonical row. No redundant post-save SELECT/refetch.
      client.setQueryData(queryKey, saved);
    },
  });
  const isSaving = useIsMutating({ mutationKey: key, exact: true }) > 0;

  const save = async (preferences: PaymentMethodPreference) => {
    if (!userId) throw new Error("Please sign in to save payment preferences.");
    if (client.isMutating({ mutationKey: key, exact: true })) throw new Error("Payment preferences are already being saved.");
    const generation = identity.current.generation;
    const target = client.getQueryCache().find({ queryKey: key, exact: true });
    const saved = await mutation.mutateAsync({ userId, generation, preferences });
    if (identity.current.userId !== userId || identity.current.generation !== generation
      || !target || client.getQueryCache().find({ queryKey: key, exact: true }) !== target) {
      throw new Error("Your account changed. Reopen payment preferences.");
    }
    return saved;
  };

  return {
    preferences: query.data ?? EMPTY_PAYMENT_METHOD_PREFERENCES,
    loading: query.isLoading,
    hasLoaded: query.data !== undefined,
    error: query.error ? "Couldn't load your payment preferences. Please try again." : null,
    refetch: query.refetch,
    isSaving,
    save,
  };
}
