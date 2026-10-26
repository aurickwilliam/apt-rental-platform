import { APP_RELEASE_PLATFORM, isSecureDownloadUrl } from "@repo/utils";

import type { createClient } from "@repo/supabase/server";

type ServerClient = Awaited<ReturnType<typeof createClient>>;

/**
 * The APK link admins publish in App updates (`app_releases`, readable without
 * signing in). Only an https link is ever returned, same rule as the mobile
 * update prompt; anything else reads as "not published yet".
 */
export async function fetchAndroidApkUrl(supabase: ServerClient): Promise<string | null> {
  const { data, error } = await supabase
    .from("app_releases")
    .select("apk_url")
    .eq("platform", APP_RELEASE_PLATFORM)
    .maybeSingle();

  if (error) {
    console.error("Could not read the Android release", error);
    return null;
  }

  const url = data?.apk_url?.trim();
  return url && isSecureDownloadUrl(url) ? url : null;
}
