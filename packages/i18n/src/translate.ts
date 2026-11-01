import type { LanguageCode } from "@repo/constants";

import { en, type TranslationKey } from "./catalogs/en";
import { fil } from "./catalogs/fil";

export type TranslateVars = Record<string, string | number>;

/** A locale-bound lookup, as returned by the platforms' `useTranslation`. */
export type Translate = (key: TranslationKey, vars?: TranslateVars) => string;

const CATALOGS: Record<LanguageCode, Record<TranslationKey, string>> = { en, fil };

const PLACEHOLDER = /\{(\w+)\}/g;

/**
 * Looks up `key` in the active catalog. The key type guarantees the English
 * catalog has it; the fallback only covers an empty Filipino value.
 */
export function translate(
  language: LanguageCode,
  key: TranslationKey,
  vars?: TranslateVars,
): string {
  const catalog = CATALOGS[language] ?? en;
  const template = catalog[key] || en[key] || key;

  if (!vars) return template;

  return template.replace(PLACEHOLDER, (match, name: string) => {
    const value = vars[name];
    return value === undefined ? match : String(value);
  });
}
