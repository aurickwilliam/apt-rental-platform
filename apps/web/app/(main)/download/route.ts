import { NextResponse } from "next/server";

import { fetchAndroidApkUrl } from "@/lib/android-apk-url";

import { createClient } from "@repo/supabase/server";

/**
 * Stable permalink for the Android build. The landing page links here instead
 * of the APK host, so publishing a new link in Admin → App updates never needs
 * a web deploy. Kept dynamic so the published link is read per request.
 */
export const dynamic = "force-dynamic";

export async function GET() {
  const apkUrl = await fetchAndroidApkUrl(await createClient());

  if (!apkUrl) {
    return new NextResponse("The Android build is not published yet.", {
      status: 404,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }

  return NextResponse.redirect(apkUrl, 302);
}
