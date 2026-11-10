import { getRelativeTime as getRelativeTimeFor, type LanguageCode } from "@repo/i18n";

/**
 * Locale-aware relative time ("just now", "5 mins ago", "Yesterday, 9:05 AM").
 * Defaults to English so existing call sites are unchanged.
 */
export function getRelativeTime(date: Date, language: LanguageCode = "en"): string {
  return getRelativeTimeFor(date, language);
}
