import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@repo/supabase";

export const AVATAR_BUCKET = "avatars";
export const AVATAR_MAX_BYTES = 5 * 1024 * 1024;
export const AVATAR_ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

const AVATAR_MAX_LONG_EDGE = 800;
const AVATAR_JPEG_QUALITY = 0.8;

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
