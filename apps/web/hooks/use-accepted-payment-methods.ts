"use client";

import { useCallback } from "react";
import { PAYMENT_METHOD_TYPES, type PaymentMethod } from "@repo/utils";

import { fetchAcceptedMethodsForTenancy } from "@/service/acceptedMethodsService";
import { useAsyncResource } from "./use-async-resource";

const ALL_METHODS: PaymentMethod[] = [...PAYMENT_METHOD_TYPES];

/**
 * The methods this tenancy's landlord accepts. While loading, or if the read fails,
 * every method is listed: the database still refuses a method the landlord turned
 * off, and its message is shown as-is.
 */
export function useAcceptedPaymentMethods(tenancyId: string | null) {
  const load = useCallback(
    () => (tenancyId ? fetchAcceptedMethodsForTenancy(tenancyId) : Promise.resolve(ALL_METHODS)),
    [tenancyId],
  );
  const { data, loading } = useAsyncResource(load, ALL_METHODS, "Couldn't load the accepted payment methods.");
  return { acceptedMethods: data, loading };
}
