"use server";

import { cookies } from "next/headers";

import { ALLOW_FILIPINO, isLanguageCode, LOCALE_COOKIE } from "@repo/i18n";

const ONE_YEAR = 60 * 60 * 24 * 365;

/**
 * Persists an explicit language choice for this browser. Detection is never
 * written back — only a deliberate switch is.
 */
export async function setLocale(language: string): Promise<void> {
  if (!isLanguageCode(language)) return;
  if (!ALLOW_FILIPINO && language !== "en") return;

  const cookieStore = await cookies();
  cookieStore.set(LOCALE_COOKIE, language, {
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: ONE_YEAR,
  });
}
