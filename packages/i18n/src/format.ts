import type { LanguageCode } from "@repo/constants";

import { LOCALE_TAGS, MONTH_NAMES, RELATIVE_TIME } from "./vocabulary";

export type DateFormatStyle = "short" | "medium" | "long" | "month" | "year";

/**
 * Locale-aware counterpart of `@repo/utils`'s `formatDate`. English keeps the
 * existing `en-US` output so nothing regresses; Filipino renders its own month
 * names so a device without `fil` ICU data still shows the right wording.
 */
export function formatDate(
  timestamp: Date | number | string,
  format: DateFormatStyle = "short",
  language: LanguageCode = "en",
): string {
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  switch (format) {
    case "month": {
      return MONTH_NAMES[language][date.getMonth()];
    }
    case "year": {
      return date.getFullYear().toString();
    }
    case "medium": {
      return date.toLocaleDateString(LOCALE_TAGS[language], {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    }
    case "long": {
      return date.toLocaleDateString(LOCALE_TAGS[language], {
        month: "long",
        day: "numeric",
        year: "numeric",
      });
    }
    default: {
      const mm = String(date.getMonth() + 1).padStart(2, "0");
      const dd = String(date.getDate()).padStart(2, "0");
      const yyyy = date.getFullYear();
      return `${mm}/${dd}/${yyyy}`;
    }
  }
}

/** Short clock time. Both locales use the 12-hour clock in the Philippines. */
export function formatClockTime(date: Date, language: LanguageCode = "en"): string {
  return date.toLocaleTimeString(LOCALE_TAGS[language], {
    hour: "numeric",
    minute: "2-digit",
  });
}

/** Locale-aware counterpart of `@repo/utils`'s `getRelativeTime`. */
export function getRelativeTime(date: Date, language: LanguageCode = "en"): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = diffMs / 1000 / 60;
  const words = RELATIVE_TIME[language];

  if (diffMins < 1) return words.justNow;

  if (diffMins < 10) {
    return words.minutesAgo(Math.floor(diffMins));
  }

  const formatTime = (value: Date) => formatClockTime(value, language);

  const isSameDay =
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear();

  if (isSameDay) {
    return formatTime(date);
  }

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);

  const isYesterday =
    date.getDate() === yesterday.getDate() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getFullYear() === yesterday.getFullYear();

  if (isYesterday) {
    return words.yesterdayAt(formatTime(date));
  }

  return date.toLocaleString(LOCALE_TAGS[language], {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

/** Month names for pickers that need the raw list rather than a formatted date. */
export function getMonthNames(language: LanguageCode = "en"): readonly string[] {
  return MONTH_NAMES[language];
}
