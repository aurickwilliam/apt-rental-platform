import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@repo/supabase";

import {
  compressAvatarImage,
  compressBackgroundImage,
  validateAvatarFile,
} from "./avatar-upload";

export const VERIFICATION_BUCKET = "user-verification";

// Upload one capture into a verification private folder. Retakes overwrite
// the same object (remove-then-upload, since the bucket has no upsert
// grant). Shared by the mobile browser wizard and the desktop wizard.
export async function uploadVerificationCapture(
  supabase: SupabaseClient<Database>,
  path: string,
  file: File,
  isSelfie: boolean,
): Promise<void> {
  const validationError = validateAvatarFile(file);
  if (validationError) throw new Error(validationError);

  const blob = isSelfie ? await compressAvatarImage(file) : await compressBackgroundImage(file);
  let { error } = await supabase.storage
    .from(VERIFICATION_BUCKET)
    .upload(path, blob, { contentType: "image/jpeg" });
  if (error && /exists|duplicate/i.test(error.message)) {
    await supabase.storage.from(VERIFICATION_BUCKET).remove([path]);
    ({ error } = await supabase.storage
      .from(VERIFICATION_BUCKET)
      .upload(path, blob, { contentType: "image/jpeg" }));
  }
  if (error) throw new Error(error.message);
}
