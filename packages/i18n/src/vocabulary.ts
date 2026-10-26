import type { LanguageCode } from "@repo/constants";

/** Locale tags used for `Intl` calls. */
export const LOCALE_TAGS: Record<LanguageCode, string> = {
  en: "en-PH",
  fil: "fil-PH",
};

/** Month names, indexed 0-11. Used where a picker needs the raw list. */
export const MONTH_NAMES: Record<LanguageCode, readonly string[]> = {
  en: [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ],
  fil: [
    "Enero",
    "Pebrero",
    "Marso",
    "Abril",
    "Mayo",
    "Hunyo",
    "Hulyo",
    "Agosto",
    "Setyembre",
    "Oktubre",
    "Nobyembre",
    "Disyembre",
  ],
};

export interface RelativeTimeVocabulary {
  justNow: string;
  minutesAgo: (count: number) => string;
  yesterdayAt: (time: string) => string;
}

/** Wording for `getRelativeTime`. Filipino puts the time marker last. */
export const RELATIVE_TIME: Record<LanguageCode, RelativeTimeVocabulary> = {
  en: {
    justNow: "just now",
    minutesAgo: (count) => `${count} min${count === 1 ? "" : "s"} ago`,
    yesterdayAt: (time) => `Yesterday, ${time}`,
  },
  fil: {
    justNow: "kanina lang",
    minutesAgo: (count) => `${count} min ang nakalipas`,
    yesterdayAt: (time) => `Kahapon, ${time}`,
  },
};
