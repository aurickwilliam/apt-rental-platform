"use client";

import { useCallback, useEffect, useState } from "react";

import { getTenantContext } from "@/service/favoritesService";
import {
  fetchHasUnreviewedTenancy,
  fetchReviewEligibility,
  fetchTenantApartmentReview,
  type TenantApartmentReview,
} from "@/service/reviewsService";

export function useReviewEligibility(apartmentId?: string) {
  const [tenantId, setTenantId] = useState<string | null>(null);
  const [reviewableTenancyId, setReviewableTenancyId] = useState<string | null>(null);
  const [existingReview, setExistingReview] = useState<TenantApartmentReview | null>(null);
  const [hasUnreviewedTenancy, setHasUnreviewedTenancy] = useState(false);
  const [checkingEligibility, setCheckingEligibility] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  const refreshEligibility = useCallback(() => {
    setCheckingEligibility(true);
    setRefreshKey((key) => key + 1);
  }, []);

  useEffect(() => {
    if (!apartmentId) return;

    let cancelled = false;

    const run = async () => {
      try {
        const context = await getTenantContext();
        if (cancelled) return;

        setTenantId(context.tenantId);
        if (!context.tenantId) {
          setReviewableTenancyId(null);
          setExistingReview(null);
          setHasUnreviewedTenancy(false);
          return;
        }

        const [tenancyId, review, unreviewed] = await Promise.all([
          fetchReviewEligibility(apartmentId, context.tenantId),
          fetchTenantApartmentReview(apartmentId, context.tenantId),
          fetchHasUnreviewedTenancy(apartmentId, context.tenantId),
        ]);
        if (cancelled) return;

        setReviewableTenancyId(tenancyId);
        setExistingReview(review);
        setHasUnreviewedTenancy(unreviewed);
      } catch (err) {
        console.error("useReviewEligibility:", err);
        if (!cancelled) {
          setReviewableTenancyId(null);
          setExistingReview(null);
        }
      } finally {
        if (!cancelled) setCheckingEligibility(false);
      }
    };

    void run();

    return () => {
      cancelled = true;
    };
  }, [apartmentId, refreshKey]);

  return {
    tenantId,
    // One review per tenant per apartment: a new review is only possible
    // when the tenant hasn't reviewed this apartment yet.
    canReview: existingReview === null && reviewableTenancyId !== null,
    canEdit: existingReview !== null,
    // Tenant has an unreviewed tenancy but hasn't stayed long enough yet.
    stayLocked: existingReview === null && reviewableTenancyId === null && hasUnreviewedTenancy,
    checkingEligibility,
    reviewableTenancyId,
    existingReview,
    refreshEligibility,
  };
}
