import { cache } from "react";
import { cookies, headers } from "next/headers";

import { LOCALE_COOKIE, resolveLocale, type LanguageCode } from "@repo/i18n";

/**
 * Resolves the locale for the current request: explicit cookie first, then
 * the browser's `Accept-Language`, then English. Memoised per request so the
 * root layout and any consumer share one lookup.
 */
export const getServerLocale = cache(async (): Promise<LanguageCode> => {
  const [cookieStore, headerList] = await Promise.all([cookies(), headers()]);

  return resolveLocale({
    stored: cookieStore.get(LOCALE_COOKIE)?.value ?? null,
    device: headerList.get("accept-language"),
  });
});
