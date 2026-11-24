import { useCallback } from "react";

import {
  detectDeviceLanguage,
  resolveLocale,
  translate,
  type LanguageCode,
  type TranslateVars,
  type TranslationKey,
} from "@repo/i18n";

import { useI18nStore } from "@/stores/useI18nStore";

/**
 * The device preference never changes during a session, so it is read once
 * rather than on every render.
 */
let deviceLanguage: string | null | undefined;
function getDeviceLanguage(): string | null {
  if (deviceLanguage === undefined) {
    deviceLanguage = detectDeviceLanguage();
  }
  return deviceLanguage;
}

/** The language the UI is showing: saved choice → device → English. */
export function useLanguage(): LanguageCode {
  return useI18nStore((state) =>
    resolveLocale({ stored: state.language, device: getDeviceLanguage() }),
  );
}

/**
 * Translation for one component. Subscribes to the store, so switching the
 * language re-renders every consumer immediately — never a restart.
 */
export function useTranslation() {
  const language = useLanguage();
  const setLanguage = useI18nStore((state) => state.setLanguage);

  const t = useCallback(
    (key: TranslationKey, vars?: TranslateVars) => translate(language, key, vars),
    [language],
  );

  return { language, setLanguage, t };
}
