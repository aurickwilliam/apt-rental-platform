import { NextResponse } from "next/server";

/**
 * Stable permalink for the Android build. The landing page's download buttons
 * link here instead of a bucket URL, so swapping the published APK (or the
 * host entirely) only means changing `NEXT_PUBLIC_APT_APK_URL` — never the
 * landing page.
 *
 * Kept dynamic so the variable is read per request, not baked at build time.
 */
export const dynamic = "force-dynamic";

export function GET() {
  const target = process.env.NEXT_PUBLIC_APT_APK_URL?.trim();

  if (!target) {
    return new NextResponse("The Android build is not published yet.", {
      status: 404,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }

  let location: URL;
  try {
    location = new URL(target);
  } catch {
    console.error("NEXT_PUBLIC_APT_APK_URL is not a valid URL.");
    return new NextResponse("The Android build link is misconfigured.", {
      status: 500,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }

  if (location.protocol !== "https:" && location.protocol !== "http:") {
    console.error("NEXT_PUBLIC_APT_APK_URL must be an http(s) URL.");
    return new NextResponse("The Android build link is misconfigured.", {
      status: 500,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }

  return NextResponse.redirect(location, 302);
}
