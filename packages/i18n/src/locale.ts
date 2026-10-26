import { APP_LANGUAGES, type LanguageCode } from "@repo/constants";

/** Cookie (web) / AsyncStorage (mobile) key holding the explicit choice. */
export const LOCALE_STORAGE_KEY = "apt-locale";
export const LOCALE_COOKIE = LOCALE_STORAGE_KEY;

export const DEFAULT_LANGUAGE: LanguageCode = "en";

/**
 * Rollout gate. Filipino stays unreachable until the shared chrome, auth,
 * settings and tenant surfaces are translated (end of Phase 2). Flipping
 * this to `true` enables detection and the language switchers together, so
 * no one is ever dropped into a half-translated app.
 */
export const ALLOW_FILIPINO = false;

export function isLanguageCode(value: unknown): value is LanguageCode {
  return APP_LANGUAGES.some(({ code }) => code === value);
}

/**
 * Resolves a single BCP-47 style tag (`fil-PH`, `en_US`, `tl`) to a supported
 * language. Tagalog maps to Filipino: they share the same written register
 * here, and a device reporting `tl` is asking for the same UI.
 */
export function parseLanguageTag(tag: string | null | undefined): LanguageCode | null {
  if (!tag) return null;
  const normalized = tag.trim().toLowerCase().replace(/_/g, "-");
  if (!normalized) return null;

  const base = normalized.split("-")[0];
  if (base === "fil" || base === "tl") return "fil";
  if (base === "en") return "en";
  return null;
}

interface AcceptLanguageEntry {
  tag: string;
  quality: number;
}

function parseAcceptLanguageEntries(header: string): AcceptLanguageEntry[] {
  return header
    .split(",")
    .map((part) => {
      const [tag = "", ...params] = part.trim().split(";");
      let quality = 1;
      for (const param of params) {
        const match = /^\s*q=([0-9.]+)\s*$/i.exec(param);
        if (!match) continue;
        const parsed = Number.parseFloat(match[1]);
        if (Number.isFinite(parsed)) quality = parsed;
      }
      return { tag: tag.trim(), quality };
    })
    .filter((entry) => entry.tag.length > 0 && entry.quality > 0)
    .sort((a, b) => b.quality - a.quality);
}

/**
 * Picks the first supported language from an `Accept-Language` header, in the
 * visitor's stated preference order. Returns null when nothing matches.
 */
export function parseAcceptLanguage(header: string | null | undefined): LanguageCode | null {
  if (!header) return null;

  for (const entry of parseAcceptLanguageEntries(header)) {
    const language = parseLanguageTag(entry.tag);
    if (language) return language;
  }
  return null;
}

/**
 * The device locale, read from the runtime's `Intl` implementation. This
 * avoids a native dependency (`expo-localization`); if a device proves
 * unreliable it can be swapped behind this single function.
 */
export function detectDeviceLanguage(): string | null {
  try {
    const resolved = new Intl.DateTimeFormat().resolvedOptions().locale;
    return typeof resolved === "string" && resolved.length > 0 ? resolved : null;
  } catch {
    return null;
  }
}

export interface ResolveLocaleInput {
  /** Explicit choice, from the cookie or AsyncStorage. */
  stored?: string | null;
  /** Device/browser preference, e.g. `Accept-Language` or the device tag. */
  device?: string | null;
  /** Rollout gate; defaults to the module flag. */
  allowFilipino?: boolean;
}

/**
 * Precedence: explicit choice → device language → English.
 * Detection is never written back; only an explicit switch persists.
 */
export function resolveLocale({
  stored,
  device,
  allowFilipino = ALLOW_FILIPINO,
}: ResolveLocaleInput): LanguageCode {
  if (!allowFilipino) return DEFAULT_LANGUAGE;

  const storedLanguage = parseLanguageTag(stored);
  if (storedLanguage) return storedLanguage;

  const deviceLanguage = parseAcceptLanguage(device);
  return deviceLanguage ?? DEFAULT_LANGUAGE;
}
