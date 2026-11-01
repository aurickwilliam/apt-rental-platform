import type { SupabaseClient } from "@supabase/supabase-js";

import { PUBLIC_IMAGE_CACHE_CONTROL } from "@repo/constants";
import type { Database } from "@repo/supabase";

export const APARTMENT_IMAGES_BUCKET = "apartment-images";

// Same two tiers as mobile (`apps/mobile/utils/compressImage.ts`).
const FULL_MAX_LONG_EDGE = 2048;
const FULL_JPEG_QUALITY = 0.8;
const THUMB_MAX_LONG_EDGE = 480;
const THUMB_JPEG_QUALITY = 0.75;

export interface UploadedApartmentImage {
  url: string;
  url_thumb: string;
  /** Storage paths, for cleanup when the listing write fails. */
  paths: string[];
}

async function resizeToJpeg(bitmap: ImageBitmap, maxLongEdge: number, quality: number): Promise<Blob> {
  const scale = Math.min(1, maxLongEdge / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(bitmap.width * scale));
  canvas.height = Math.max(1, Math.round(bitmap.height * scale));

  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Couldn't process that image. Please try another file.");
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);

  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", quality));
  if (!blob) throw new Error("Couldn't process that image. Please try another file.");
  return blob;
}

/** Compresses a photo into the full + thumbnail JPEG tiers. */
export async function buildApartmentImageTiers(file: File): Promise<{ full: Blob; thumb: Blob }> {
  const bitmap = await createImageBitmap(file);
  try {
    const [full, thumb] = await Promise.all([
      resizeToJpeg(bitmap, FULL_MAX_LONG_EDGE, FULL_JPEG_QUALITY),
      resizeToJpeg(bitmap, THUMB_MAX_LONG_EDGE, THUMB_JPEG_QUALITY),
    ]);
    return { full, thumb };
  } finally {
    bitmap.close();
  }
}

/**
 * Uploads both tiers under `{apartmentId}/` with a fresh name and returns
 * their permanent public URLs (the bucket is public).
 */
export async function uploadApartmentImage(
  supabase: SupabaseClient<Database>,
  apartmentId: string,
  file: File
): Promise<UploadedApartmentImage> {
  const { full, thumb } = await buildApartmentImageTiers(file);
  const base = `${apartmentId}/${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const fullPath = `${base}.jpg`;
  const thumbPath = `${base}_thumb.jpg`;
  const bucket = supabase.storage.from(APARTMENT_IMAGES_BUCKET);

  const results = await Promise.all([
    bucket.upload(fullPath, full, { contentType: "image/jpeg", cacheControl: PUBLIC_IMAGE_CACHE_CONTROL }),
    bucket.upload(thumbPath, thumb, { contentType: "image/jpeg", cacheControl: PUBLIC_IMAGE_CACHE_CONTROL }),
  ]);
  const failed = results.find((result) => result.error);
  if (failed?.error) {
    await bucket.remove([fullPath, thumbPath]);
    throw failed.error;
  }

  return {
    url: bucket.getPublicUrl(fullPath).data.publicUrl,
    url_thumb: bucket.getPublicUrl(thumbPath).data.publicUrl,
    paths: [fullPath, thumbPath],
  };
}
