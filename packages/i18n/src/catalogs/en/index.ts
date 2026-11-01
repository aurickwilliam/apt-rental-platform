import { apartment } from "./apartment";
import { apply } from "./apply";
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
import { passport } from "./passport";
import { reviews } from "./reviews";
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
  ...browse,
  ...favorites,
  ...apartment,
  ...reviews,
  ...apply,
  ...passport,
} as const;

export type TranslationKey = keyof typeof en;
