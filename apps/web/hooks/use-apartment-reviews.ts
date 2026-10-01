"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import {
  fetchApartmentReviews,
  mapReviewRow,
  type ApartmentReview,
  type RatingBucket,
} from "@/service/reviewsService";
import { useReviewEligibility } from "./use-review-eligibility";

export type ReviewSortOption = "Most Recent" | "Highest Rating" | "Lowest Rating";

type ReviewRow = Awaited<ReturnType<typeof fetchApartmentReviews>>[number];

function toErrorMessage(error: unknown): string | null {
  if (!error) return null;
  if (error instanceof Error) return error.message;
  return "Failed to load reviews.";
}

export function useApartmentReviews(apartmentId?: string) {
  const [sortBy, setSortBy] = useState<ReviewSortOption>("Most Recent");
  const [rows, setRows] = useState<ReviewRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const { canReview, canEdit, checkingEligibility, reviewableTenancyId, existingReview, refreshEligibility } =
    useReviewEligibility(apartmentId);

  const refresh = useCallback(() => {
    setLoading(true);
    setRefreshKey((key) => key + 1);
    refreshEligibility();
  }, [refreshEligibility]);

  useEffect(() => {
    if (!apartmentId) return;

    let cancelled = false;

    const run = async () => {
      setError(null);
      try {
        const data = await fetchApartmentReviews(apartmentId);
        if (!cancelled) setRows(data);
      } catch (err) {
        console.error("useApartmentReviews:", err);
        if (!cancelled) setError(toErrorMessage(err));
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void run();

    return () => {
      cancelled = true;
    };
  }, [apartmentId, refreshKey]);

  const reviews = useMemo<ApartmentReview[]>(() => {
    const mapped = rows.map(mapReviewRow);
    const sorted = [...mapped];

    switch (sortBy) {
      case "Highest Rating":
        sorted.sort(
          (a, b) => b.rating - a.rating || new Date(b.date).getTime() - new Date(a.date).getTime(),
        );
        break;
      case "Lowest Rating":
        sorted.sort(
          (a, b) => a.rating - b.rating || new Date(b.date).getTime() - new Date(a.date).getTime(),
        );
        break;
      case "Most Recent":
      default:
        sorted.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        break;
    }

    return sorted;
  }, [rows, sortBy]);

  const totalReviews = rows.length;

  const overallRating = useMemo(() => {
    if (totalReviews === 0) return 0;
    const sum = rows.reduce((acc, row) => acc + Number(row.rating), 0);
    return Math.round((sum / totalReviews) * 10) / 10;
  }, [rows, totalReviews]);

  const ratingsCount = useMemo<RatingBucket[]>(() => {
    const buckets = [5, 4, 3, 2, 1].map((rating) => ({
      rating,
      ratingCount: 0,
      totalCount: totalReviews,
    }));

    rows.forEach((row) => {
      const bucketRating = Math.min(5, Math.max(1, Math.round(Number(row.rating))));
      const bucket = buckets.find((b) => b.rating === bucketRating);
      if (bucket) bucket.ratingCount += 1;
    });

    return buckets;
  }, [rows, totalReviews]);

  return {
    loading,
    error,
    overallRating,
    totalReviews,
    ratingsCount,
    reviews,
    sortBy,
    setSortBy,
    canReview,
    canEdit,
    checkingEligibility,
    reviewableTenancyId,
    existingReview,
    refresh,
  };
}
