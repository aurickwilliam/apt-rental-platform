import { useCallback, useState } from 'react';
import * as ImagePicker from 'expo-image-picker';
import { File } from 'expo-file-system';
import * as Crypto from 'expo-crypto';

import { supabase } from '@repo/supabase';
import { useProfile } from '../auth/useProfile';

type SubmitReviewParams = {
  tenancyId: string;
  rating: number;
  comment: string;
  stayedDate: string;
  images?: ImagePicker.ImagePickerAsset[];
};

type SubmitReviewResult = {
  success: boolean;
  error?: string;
};

const REVIEW_IMAGES_BUCKET = 'review-images';

export function useSubmitReview() {
  const { profile } = useProfile();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const uploadReviewImages = useCallback(
    async (tenantId: string, reviewId: string, images: ImagePicker.ImagePickerAsset[]) => {
      const paths: string[] = [];

      for (const image of images) {
        const ext = image.uri.split('.').pop() ?? 'jpg';
        const path = `${tenantId}/${reviewId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

        const file = new File(image.uri);
        const bytes = await file.bytes();

        const { error: uploadError } = await supabase.storage
          .from(REVIEW_IMAGES_BUCKET)
          .upload(path, bytes, {
            contentType: image.mimeType ?? 'image/jpeg',
          });

        if (uploadError) {
          // Roll back any images that DID upload before this one failed —
          // don't leave partial photo sets orphaned in storage.
          if (paths.length > 0) {
            await supabase.storage.from(REVIEW_IMAGES_BUCKET).remove(paths);
          }
          throw new Error(`Failed to upload photo: ${uploadError.message}`);
        }

        paths.push(path);
      }

      return paths;
    },
    []
  );

  const submitReview = useCallback(
    async ({
      tenancyId,
      rating,
      comment,
      stayedDate,
      images = [],
    }: SubmitReviewParams): Promise<SubmitReviewResult> => {
      if (!profile) {
        const message = 'Profile not loaded yet. Please try again.';
        setError(message);
        return { success: false, error: message };
      }

      setIsSubmitting(true);
      setError(null);

      // Pre-generate the review id so images can be uploaded to their final
      // path BEFORE the review row exists — if the upload fails, we bail
      // out here and no review is ever inserted.
      const reviewId = Crypto.randomUUID();
      let uploadedPaths: string[] = [];

      try {
        if (images.length > 0) {
          try {
            uploadedPaths = await uploadReviewImages(profile.id, reviewId, images);
          } catch (uploadErr) {
            const message =
              uploadErr instanceof Error
                ? uploadErr.message
                : 'Failed to upload photos. Please try again.';
            setError(message);
            return { success: false, error: message };
          }
        }

        // apartment_id and tenant_id are populated by the
        // sync_review_tenancy_fields BEFORE INSERT trigger from tenancy_id
        const { data: review, error: insertError } = await supabase
          .from('reviews')
          .insert({
            id: reviewId,
            tenancy_id: tenancyId,
            rating,
            comment,
            stayed_date: stayedDate,
            image_paths: uploadedPaths,
          } as never)
          .select('id')
          .single();

        if (insertError || !review) {
          // Insert failed after a successful upload — clean up the orphaned images
          if (uploadedPaths.length > 0) {
            await supabase.storage.from(REVIEW_IMAGES_BUCKET).remove(uploadedPaths);
          }

          if (insertError?.code === '23505') {
            throw new Error('You have already reviewed this stay.');
          }
          throw new Error(insertError?.message ?? 'Failed to submit review.');
        }

        return { success: true };
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Something went wrong. Please try again.';
        setError(message);
        return { success: false, error: message };
      } finally {
        setIsSubmitting(false);
      }
    },
    [profile, uploadReviewImages]
  );

  return { submitReview, isSubmitting, error };
}
