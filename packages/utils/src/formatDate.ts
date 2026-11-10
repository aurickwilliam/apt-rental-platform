import { formatDate as formatDateFor, type DateFormatStyle, type LanguageCode } from "@repo/i18n";

type DateFormat = DateFormatStyle;

/**
 * Locale-aware date formatting. The trailing `language` argument is optional
 * so existing call sites keep their exact English output; translated surfaces
 * pass the active language.
 */
export function formatDate(
  timestamp: Date | number | string,
  format: DateFormat = "short",
  language: LanguageCode = "en",
): string {
  return formatDateFor(timestamp, format, language);
}
