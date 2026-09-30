"use client";

import { useCallback, useState } from "react";

import { getTenantContext } from "@/service/favoritesService";
import {
  MAX_REVIEW_IMAGES,
  fetchTenantApartmentReview,
  insertReview,
  removeReviewImages,
  updateReview,
  uploadReviewImages,
} from "@/service/reviewsService";

export type SubmitReviewInput = {
  apartmentId: string;
  tenancyId: string;
  rating: number;
  comment: string;
  stayedDate: string;
  images?: File[];
};

export type UpdateReviewInput = {
  reviewId: string;
  tenantId: string;
  rating: number;
  comment: string;
  keptPaths: string[];
  removedPaths: string[];
  newImages?: File[];
};

export type SubmitReviewResult = {
  success: boolean;
  error?: string;
};

function newReviewId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function useSubmitReview() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submitReview = useCallback(
    async ({
      apartmentId,
      tenancyId,
      rating,
      comment,
      stayedDate,
      images = [],
    }: SubmitReviewInput): Promise<SubmitReviewResult> => {
      setIsSubmitting(true);
      setError(null);

      // Pre-generate the review id so images can be uploaded to their final
      // path BEFORE the review row exists — if the upload fails, we bail
      // out here and no review is ever inserted.
      const reviewId = newReviewId();
      let uploadedPaths: string[] = [];

      try {
        const context = await getTenantContext();
        if (!context.tenantId) {
          throw new Error("You must be signed in as a tenant to submit a review.");
        }

        // One review per tenant per apartment (client-side guard — the
        // per-tenancy unique constraint remains the database authority).
        const alreadyReviewed = await fetchTenantApartmentReview(apartmentId, context.tenantId);
        if (alreadyReviewed) {
          throw new Error("You have already reviewed this apartment. You can edit your review instead.");
        }

        const files = images.slice(0, MAX_REVIEW_IMAGES);
        if (files.length > 0) {
          try {
            uploadedPaths = await uploadReviewImages(context.tenantId, reviewId, files);
          } catch (uploadErr) {
            throw new Error(
              uploadErr instanceof Error
                ? uploadErr.message
                : "Failed to upload photos. Please try again.",
            );
          }
        }

        try {
          await insertReview({
            id: reviewId,
            tenancyId,
            rating,
            comment,
            stayedDate,
            imagePaths: uploadedPaths,
          });
        } catch (insertErr) {
          // Insert failed after a successful upload — clean up the orphaned images.
          await removeReviewImages(uploadedPaths);
          throw insertErr;
        }

        return { success: true };
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Something went wrong. Please try again.";
        setError(message);
        return { success: false, error: message };
      } finally {
        setIsSubmitting(false);
      }
    },
    [],
  );

  const updateExistingReview = useCallback(
    async ({
      reviewId,
      tenantId,
      rating,
      comment,
      keptPaths,
      removedPaths,
      newImages = [],
    }: UpdateReviewInput): Promise<SubmitReviewResult> => {
      setIsSubmitting(true);
      setError(null);

      let uploadedPaths: string[] = [];

      try {
        const files = newImages.slice(0, Math.max(0, MAX_REVIEW_IMAGES - keptPaths.length));
        if (files.length > 0) {
          try {
            // New photos land in the same {tenantId}/{reviewId} folder so the
            // owner-scoped storage policies keep applying.
            uploadedPaths = await uploadReviewImages(tenantId, reviewId, files);
          } catch (uploadErr) {
            throw new Error(
              uploadErr instanceof Error
                ? uploadErr.message
                : "Failed to upload photos. Please try again.",
            );
          }
        }

        const nextPaths = [...keptPaths, ...uploadedPaths];

        try {
          await updateReview({ id: reviewId, rating, comment, imagePaths: nextPaths });
        } catch (updateErr) {
          // Row update failed — only the newly uploaded photos are orphaned.
          await removeReviewImages(uploadedPaths);
          throw updateErr;
        }

        // Photos the tenant removed are no longer referenced — delete them so
        // storage doesn't accumulate orphans. Best-effort: the row is already saved.
        await removeReviewImages(removedPaths);

        return { success: true };
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Something went wrong. Please try again.";
        setError(message);
        return { success: false, error: message };
      } finally {
        setIsSubmitting(false);
      }
    },
    [],
  );

  return { submitReview, updateExistingReview, isSubmitting, error };
}
