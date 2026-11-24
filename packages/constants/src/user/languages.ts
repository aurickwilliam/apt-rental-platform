export const APP_LANGUAGES = [
  { code: "en", label: "English" },
  { code: "fil", label: "Filipino" },
] as const;

export type LanguageCode = (typeof APP_LANGUAGES)[number]["code"];
