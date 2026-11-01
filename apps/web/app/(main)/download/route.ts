import { NextResponse } from "next/server";

import { fetchAndroidApkUrl } from "@/lib/android-apk-url";
import { openDownloadStream } from "@/lib/app-release-link";

import { createClient } from "@repo/supabase/server";

const APK_CONTENT_TYPE = "application/vnd.android.package-archive";
const FALLBACK_FILE_NAME = "apt.apk";

/**
 * Stable permalink for the Android build. The landing page links here instead
 * of the APK host, so publishing a new link in Admin → App updates never needs
 * a web deploy. Kept dynamic so the published link is read per request.
 *
 * The file is streamed from this page as an attachment, so visitors download
 * it straight away and never land on the host's own page. If the host cannot
 * be reached from the server, the visitor is redirected to it instead.
 */
export const dynamic = "force-dynamic";

function fileNameFromUrl(link: string): string {
  const name = new URL(link).pathname.split("/").pop() ?? "";
  return name.toLowerCase().endsWith(".apk") ? name.replace(/[^\w.-]/g, "_") : FALLBACK_FILE_NAME;
}

export async function GET() {
  const apkUrl = await fetchAndroidApkUrl(await createClient());

  if (!apkUrl) {
    return new NextResponse("The Android build is not published yet.", {
      status: 404,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }

  const file = await openDownloadStream(apkUrl);
  if (!file?.body) return NextResponse.redirect(apkUrl, 302);

  const headers = new Headers({
    "Content-Type": APK_CONTENT_TYPE,
    "Content-Disposition": `attachment; filename="${fileNameFromUrl(apkUrl)}"`,
    "Cache-Control": "no-store",
  });
  const length = file.headers.get("content-length");
  if (length) headers.set("Content-Length", length);

  return new NextResponse(file.body, { status: 200, headers });
}
