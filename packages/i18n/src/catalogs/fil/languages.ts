import type { languages as enLanguages } from "../en/languages";

/** Language names read the same in both locales, by design. */
export const languages: Record<keyof typeof enLanguages, string> = {
  "languages.en": "English",
  "languages.fil": "Filipino",
};
