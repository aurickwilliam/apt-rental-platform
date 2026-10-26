import type { TranslationKey } from "../en";
import { auth } from "./auth";
import { common } from "./common";
import { enums } from "./enums";
import { errors } from "./errors";
import { languages } from "./languages";
import { nav } from "./nav";
import { notifications } from "./notifications";
import { settings } from "./settings";
import { validation } from "./validation";

/**
 * Typed against the English catalog, so a missing or renamed key is a
 * compile error rather than a silent English fallback. `index.test.ts`
 * additionally checks the reverse (no orphan keys) and placeholder parity.
 */
export const fil: Record<TranslationKey, string> = {
  ...common,
  ...nav,
  ...settings,
  ...auth,
  ...languages,
  ...validation,
  ...errors,
  ...notifications,
  ...enums,
};
