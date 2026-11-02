"use client";

import { useCallback } from "react";
import { PAYMENT_METHOD_TYPES, type PaymentMethod } from "@repo/utils";

import { fetchLandlordAcceptedMethods, saveLandlordAcceptedMethods } from "@/service/acceptedMethodsService";
import { useAsyncResource } from "./use-async-resource";

const ALL_METHODS: PaymentMethod[] = [...PAYMENT_METHOD_TYPES];

/** The landlord's own accepted-methods setting (method names only). */
export function useLandlordPaymentMethods(landlordId: string | null) {
  const load = useCallback(
    () => (landlordId ? fetchLandlordAcceptedMethods(landlordId) : Promise.resolve(ALL_METHODS)),
    [landlordId],
  );
  const { setData, ...resource } = useAsyncResource(load, ALL_METHODS, "Couldn't load your payment methods.");

  const save = useCallback(
    async (methods: readonly PaymentMethod[]): Promise<PaymentMethod[]> => {
      if (!landlordId) throw new Error("Please sign in to save payment methods.");
      const saved = await saveLandlordAcceptedMethods(landlordId, methods);
      setData(saved);
      return saved;
    },
    [landlordId, setData],
  );

  return { ...resource, save };
}
