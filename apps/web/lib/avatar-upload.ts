import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@repo/supabase";

export const AVATAR_BUCKET = "avatars";
export const BACKGROUND_BUCKET = "background_photos";
export const AVATAR_MAX_BYTES = 5 * 1024 * 1024;
export const AVATAR_ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

const AVATAR_MAX_LONG_EDGE = 512;
const AVATAR_JPEG_QUALITY = 0.8;
const BACKGROUND_MAX_LONG_EDGE = 1600;
const BACKGROUND_JPEG_QUALITY = 0.8;

export function validateAvatarFile(file: File): string | null {
  if (!AVATAR_ALLOWED_TYPES.includes(file.type)) {
    return "Please choose a JPG, PNG, or WebP image.";
  }
  if (file.size > AVATAR_MAX_BYTES) {
    return "Image must be 5MB or smaller.";
  }
  return null;
}

export async function compressAvatarImage(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  try {
    const side = Math.min(bitmap.width, bitmap.height);
    const scale = Math.min(1, AVATAR_MAX_LONG_EDGE / side);
    const size = Math.max(1, Math.round(side * scale));

    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;

    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Couldn't process that image. Please try another file.");

    ctx.drawImage(
      bitmap,
      (bitmap.width - side) / 2,
      (bitmap.height - side) / 2,
      side,
      side,
      0,
      0,
      size,
      size
    );

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", AVATAR_JPEG_QUALITY)
    );
    if (!blob) throw new Error("Couldn't process that image. Please try another file.");
    return blob;
  } finally {
    bitmap.close();
  }
}

export async function uploadAvatar(
  supabase: SupabaseClient<Database>,
  authUserId: string,
  image: Blob
): Promise<string> {
  const path = `${authUserId}/${authUserId}.jpg`;

  const { error: uploadError } = await supabase.storage.from(AVATAR_BUCKET).upload(path, image, {
    contentType: "image/jpeg",
    upsert: true,
  });
  if (uploadError) throw new Error(uploadError.message);

  const { data } = supabase.storage.from(AVATAR_BUCKET).getPublicUrl(path);
  const publicUrl = `${data.publicUrl}?t=${Date.now()}`;

  const { error: updateError } = await supabase
    .from("users")
    .update({ avatar_url: publicUrl, updated_at: new Date().toISOString() })
    .eq("user_id", authUserId);
  if (updateError) throw new Error(updateError.message);

  return publicUrl;
}

export async function compressBackgroundImage(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  try {
    const scale = Math.min(
      1,
      BACKGROUND_MAX_LONG_EDGE / Math.max(bitmap.width, bitmap.height)
    );
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Couldn't process that image. Please try another file.");

    ctx.drawImage(bitmap, 0, 0, bitmap.width, bitmap.height, 0, 0, width, height);

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", BACKGROUND_JPEG_QUALITY)
    );
    if (!blob) throw new Error("Couldn't process that image. Please try another file.");
    return blob;
  } finally {
    bitmap.close();
  }
}

export async function uploadBackground(
  supabase: SupabaseClient<Database>,
  authUserId: string,
  image: Blob
): Promise<string> {
  const path = `${authUserId}/${authUserId}.jpg`;

  const { error: uploadError } = await supabase.storage.from(BACKGROUND_BUCKET).upload(path, image, {
    contentType: "image/jpeg",
    upsert: true,
  });
  if (uploadError) throw new Error(uploadError.message);

  const { data } = supabase.storage.from(BACKGROUND_BUCKET).getPublicUrl(path);
  const publicUrl = `${data.publicUrl}?t=${Date.now()}`;

  const { error: updateError } = await supabase
    .from("users")
    .update({ background_url: publicUrl, updated_at: new Date().toISOString() })
    .eq("user_id", authUserId);
  if (updateError) throw new Error(updateError.message);

  return publicUrl;
}

export async function removeAvatar(
  supabase: SupabaseClient<Database>,
  authUserId: string
): Promise<void> {
  const path = `${authUserId}/${authUserId}.jpg`;

  const { error: removeError } = await supabase.storage.from(AVATAR_BUCKET).remove([path]);
  if (removeError) throw new Error(removeError.message);

  const { error: updateError } = await supabase
    .from("users")
    .update({ avatar_url: null, updated_at: new Date().toISOString() })
    .eq("user_id", authUserId);
  if (updateError) throw new Error(updateError.message);
}

export async function removeBackground(
  supabase: SupabaseClient<Database>,
  authUserId: string
): Promise<void> {
  const path = `${authUserId}/${authUserId}.jpg`;

  const { error: removeError } = await supabase.storage.from(BACKGROUND_BUCKET).remove([path]);
  if (removeError) throw new Error(removeError.message);

  const { error: updateError } = await supabase
    .from("users")
    .update({ background_url: null, updated_at: new Date().toISOString() })
    .eq("user_id", authUserId);
  if (updateError) throw new Error(updateError.message);
}
