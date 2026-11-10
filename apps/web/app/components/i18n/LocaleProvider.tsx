"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  useTransition,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";

import {
  translate,
  type LanguageCode,
  type TranslateVars,
  type TranslationKey,
} from "@repo/i18n";

import { setLocale } from "@/app/(auth)/actions/locale";

interface LocaleContextValue {
  language: LanguageCode;
  /** True while the language cookie write is in flight. */
  pending: boolean;
  setLanguage: (language: LanguageCode) => void;
  t: (key: TranslationKey, vars?: TranslateVars) => string;
}

const LocaleContext = createContext<LocaleContextValue | null>(null);

/**
 * Seeds the client tree with the server-resolved locale so the first paint is
 * already in the right language. The server action writes the cookie and the
 * refresh re-renders `<html lang>`; the context value switches optimistically
 * so copy changes before the round trip settles.
 *
 * Never key a subtree by `language` — that would remount forms and discard
 * in-progress input.
 */
export function LocaleProvider({
  initialLanguage,
  children,
}: {
  initialLanguage: LanguageCode;
  children: ReactNode;
}) {
  const router = useRouter();
  const [language, setLanguageState] = useState<LanguageCode>(initialLanguage);
  const [pending, startTransition] = useTransition();

  // A refresh can hand us a different server locale (sign-out reset, another
  // tab). Resets happen during render rather than in an effect.
  const [serverLanguage, setServerLanguage] = useState<LanguageCode>(initialLanguage);
  if (serverLanguage !== initialLanguage) {
    setServerLanguage(initialLanguage);
    setLanguageState(initialLanguage);
  }

  const setLanguage = useCallback(
    (next: LanguageCode) => {
      if (next === language) return;

      setLanguageState(next);
      startTransition(async () => {
        await setLocale(next);
        router.refresh();
      });
    },
    [language, router],
  );

  const t = useCallback(
    (key: TranslationKey, vars?: TranslateVars) => translate(language, key, vars),
    [language],
  );

  const value = useMemo<LocaleContextValue>(
    () => ({ language, pending, setLanguage, t }),
    [language, pending, setLanguage, t],
  );

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useTranslation(): LocaleContextValue {
  const context = useContext(LocaleContext);
  if (!context) {
    throw new Error("useTranslation must be used inside LocaleProvider");
  }
  return context;
}
