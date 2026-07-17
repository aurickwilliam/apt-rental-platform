import { useCallback, useState } from 'react';
import * as ImagePicker from 'expo-image-picker';
import { File } from 'expo-file-system';

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
        // folder[1] must be the tenant's own users.id — enforced by storage RLS
        const path = `${tenantId}/${reviewId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

        const file = new File(image.uri);
        const bytes = await file.bytes();

        const { error: uploadError } = await supabase.storage
          .from(REVIEW_IMAGES_BUCKET)
          .upload(path, bytes, {
            contentType: image.mimeType ?? 'image/jpeg',
          });

        if (uploadError) {
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

      try {
        // apartment_id and tenant_id are populated by the
        // sync_review_tenancy_fields BEFORE INSERT trigger from tenancy_id
        const { data: review, error: insertError } = await supabase
          .from('reviews')
          .insert({
            tenancy_id: tenancyId,
            rating,
            comment,
            stayed_date: stayedDate,
          } as never)
          .select('id')
          .single();

        if (insertError || !review) {
          // Postgres unique_violation — the UNIQUE (tenancy_id) constraint
          if (insertError?.code === '23505') {
            throw new Error('You have already reviewed this stay.');
          }
          throw new Error(insertError?.message ?? 'Failed to submit review.');
        }

        if (images.length > 0) {
          const imagePaths = await uploadReviewImages(profile.id, review.id, images);

          const { error: updateError } = await supabase
            .from('reviews')
            .update({ image_paths: imagePaths })
            .eq('id', review.id);

          if (updateError) {
            // Review itself succeeded — don't fail the whole submission over photos
            setError('Review submitted, but photos failed to upload.');
            return { success: true, error: 'Photos failed to upload' };
          }
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
