"use client";

import { useCallback } from "react";

import type { PaymentMethodPreference } from "@/app/tenant/payment/types";
import { fetchPaymentMethodPreferences, savePaymentMethodPreferences } from "@/service/paymentPreferencesService";
import { useAsyncResource } from "./use-async-resource";

const EMPTY_PREFERENCES: PaymentMethodPreference = { savedMethods: [], defaultMethod: null };

export function usePaymentMethodPreferences(userId: string | null) {
  const load = useCallback(
    () => (userId ? fetchPaymentMethodPreferences(userId) : Promise.resolve(EMPTY_PREFERENCES)),
    [userId],
  );
  const { setData, ...resource } = useAsyncResource(load, EMPTY_PREFERENCES, "Couldn't load your payment preferences.");

  const save = useCallback(
    async (preferences: PaymentMethodPreference): Promise<PaymentMethodPreference> => {
      if (!userId) throw new Error("Please sign in to save payment preferences.");
      const saved = await savePaymentMethodPreferences(userId, preferences);
      setData(saved);
      return saved;
    },
    [setData, userId],
  );

  return { ...resource, save };
}
