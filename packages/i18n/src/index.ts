export { APP_LANGUAGES, type LanguageCode } from "@repo/constants/languages";

export { en, type TranslationKey } from "./catalogs/en";
export { fil } from "./catalogs/fil";
export { translate, type TranslateVars } from "./translate";

export {
  ALLOW_FILIPINO,
  DEFAULT_LANGUAGE,
  LOCALE_COOKIE,
  LOCALE_STORAGE_KEY,
  detectDeviceLanguage,
  isLanguageCode,
  parseAcceptLanguage,
  parseLanguageTag,
  resolveLocale,
  type ResolveLocaleInput,
} from "./locale";

export {
  formatClockTime,
  formatDate,
  getMonthNames,
  getRelativeTime,
  type DateFormatStyle,
} from "./format";

export {
  LOCALE_TAGS,
  MONTH_NAMES,
  RELATIVE_TIME,
  type RelativeTimeVocabulary,
} from "./vocabulary";

export {
  AMENITY_KEYS,
  APARTMENT_STATUS_KEYS,
  APARTMENT_TYPE_KEYS,
  EMPLOYMENT_TYPE_KEYS,
  FLOOR_LEVEL_KEYS,
  FURNISHED_TYPE_KEYS,
  GENDER_KEYS,
  LEASE_DURATION_KEYS,
  MAINTENANCE_CATEGORY_KEYS,
  MAINTENANCE_URGENCY_KEYS,
  PAYMENT_STATUS_KEYS,
  PET_KEYS,
  VEHICLE_KEYS,
  enumLabel,
  type EnumKeyMap,
} from "./enums";
