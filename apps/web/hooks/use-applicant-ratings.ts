"use client";

import { useCallback } from "react";

import { useAsyncResource } from "@/hooks/use-async-resource";
import { fetchApplicantRatings, type ApplicantRatings } from "@/service/tenantRatingsService";

const NO_RATINGS: ApplicantRatings = { records: [], average: 0, count: 0 };

/**
 * The applicant's landlord ratings for the application detail page. The read is
 * independent of the application itself, so a failure only sets `error` here and
 * never blocks approving or rejecting.
 */
export function useApplicantRatings(tenantId: string | null) {
  const load = useCallback(
    () => (tenantId ? fetchApplicantRatings(tenantId) : Promise.resolve(NO_RATINGS)),
    [tenantId],
  );
  const { data, loading, error, refresh } = useAsyncResource(load, NO_RATINGS, "Could not load this tenant's ratings.");
  return { ratings: error ? NO_RATINGS : data, loading, error, refresh };
}
