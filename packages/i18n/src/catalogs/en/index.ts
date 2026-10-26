import { auth } from "./auth";
import { authMobile } from "./authMobile";
import { common } from "./common";
import { enums } from "./enums";
import { errors } from "./errors";
import { languages } from "./languages";
import { nav } from "./nav";
import { notifications } from "./notifications";
import { settings } from "./settings";
import { validation } from "./validation";

/**
 * The English catalog is the source of truth. `TranslationKey` is derived
 * from it, so referencing a key that does not exist fails to compile.
 */
export const en = {
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
} as const;

export type TranslationKey = keyof typeof en;
