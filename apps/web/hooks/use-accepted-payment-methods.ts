"use client";

import { useCallback } from "react";
import type { PaymentMethod } from "@repo/utils";

import { fetchAcceptedMethodsForTenancy } from "@/service/acceptedMethodsService";
import { useAsyncResource } from "./use-async-resource";

const NO_METHODS: PaymentMethod[] = [];

/**
 * The methods this tenancy's landlord accepts. Nothing is offered until the list has
 * loaded, and a failed read offers nothing (with a retry) rather than every method: the
 * checkout never guesses what the landlord allows. The database and the paymongo
 * function enforce it too.
 */
export function useAcceptedPaymentMethods(tenancyId: string | null) {
  const load = useCallback(
    () => (tenancyId ? fetchAcceptedMethodsForTenancy(tenancyId) : Promise.resolve(NO_METHODS)),
    [tenancyId],
  );
  const { data, loading, error, refresh } = useAsyncResource(
    load,
    NO_METHODS,
    "Couldn't load the payment methods your landlord accepts. Please try again.",
  );
  return { acceptedMethods: data, loading, error, refresh };
}
