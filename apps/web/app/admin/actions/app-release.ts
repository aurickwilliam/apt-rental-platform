"use server";

import { createClient } from "@repo/supabase/server";
import { APP_RELEASE_PLATFORM, validateAppRelease, type AppReleaseField } from "@repo/utils";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "../_lib/require-admin";

export interface PublishAppReleaseResult {
  ok?: boolean;
  error?: string;
  fieldErrors?: Partial<Record<AppReleaseField, string>>;
}

function text(formData: FormData, key: AppReleaseField): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

export async function publishAppRelease(formData: FormData): Promise<PublishAppReleaseResult> {
  await requireAdmin();
  const input = {
    latestVersion: text(formData, "latestVersion"),
    minVersion: text(formData, "minVersion"),
    apkUrl: text(formData, "apkUrl"),
    releaseNotes: text(formData, "releaseNotes"),
  };
  const fieldErrors = validateAppRelease(input);
  if (Object.keys(fieldErrors).length > 0) return { fieldErrors };

  // The RPC authorizes the caller from auth.uid() (admin second step included).
  const supabase = await createClient();
  const { error } = await supabase.rpc("admin_publish_app_release", {
    p_platform: APP_RELEASE_PLATFORM,
    p_latest_version: input.latestVersion,
    p_min_version: input.minVersion,
    p_apk_url: input.apkUrl,
    p_release_notes: input.releaseNotes,
  });
  if (error) {
    console.error("Admin app release publish failed", error);
    return { error: "The release could not be published. Refresh and try again." };
  }
  revalidatePath("/admin/app-updates");
  return { ok: true };
}
