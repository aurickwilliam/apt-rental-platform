"use client";

import { useCallback, useMemo } from "react";
import { createClient } from "@repo/supabase/browser";
import type { ListingReviewState } from "@repo/utils";

import { fetchListingReviewState } from "@/service/listingReviewService";
import { useAsyncResource } from "./use-async-resource";

const NOT_HIDDEN: ListingReviewState = { hidden: false, reason: null, hiddenAt: null, request: null };

/** Whether an admin hid this listing, why, and the state of the landlord's review request. */
export function useListingReview(apartmentId: string) {
  const supabase = useMemo(() => createClient(), []);
  const load = useCallback(() => fetchListingReviewState(supabase, apartmentId), [supabase, apartmentId]);
  const { data, loading, error, refresh } = useAsyncResource(
    load,
    NOT_HIDDEN,
    "Couldn't check whether this listing is hidden.",
  );
  return { state: data, loading, error, refresh };
}
