import type { TranslationKey } from "../en";
import { apartment } from "./apartment";
import { auth } from "./auth";
import { browse } from "./browse";
import { authMobile } from "./authMobile";
import { common } from "./common";
import { enums } from "./enums";
import { favorites } from "./favorites";
import { errors } from "./errors";
import { languages } from "./languages";
import { nav } from "./nav";
import { notifications } from "./notifications";
import { reviews } from "./reviews";
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
  ...authMobile,
  ...languages,
  ...validation,
  ...errors,
  ...notifications,
  ...enums,
  ...browse,
  ...favorites,
  ...apartment,
  ...reviews,
};
