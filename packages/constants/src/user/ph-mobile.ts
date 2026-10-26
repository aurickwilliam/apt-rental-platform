export interface PHMobileValidation {
  isValid: boolean;
  errorMessage: string | null;
  formattedNumber: string | null;
  prefix: string | null;
}

// Longest thing a person can reasonably type: "+63 917 123 4567".
export const PH_MOBILE_MAX_INPUT_LENGTH = 17;

// Mobile numbers are a 10-digit national number after the leading 0 / +63.
// The NTC mobile range is the whole 9XX block (0900-0999), so every 9XX prefix
// is accepted: operators are issued new blocks (0924/0925/0934/0944 in 2025)
// faster than any list can follow, and number portability means the prefix no
// longer identifies the operator anyway. The 8XX series is allocated in a few
// blocks only (Smart 813, Globe 817, DITO 895-899), so those stay explicit.
const NATIONAL_NUMBER = /^(9\d{2}|813|817|89[5-9])\d{7}$/;
const LOOKS_LIKE_NATIONAL_NUMBER = /^[89]\d{9}$/;

// "+63", "63" or "0063", optionally followed by the trunk 0 that people often
// keep ("+63 0917 ..."), then the 10-digit national number; or a trunk 0; or
// the bare national number.
const COUNTRY_CODE_PREFIX = /^(?:\+?63|0063)0?(?=\d{10}$)/;
const TRUNK_PREFIX = /^0(?=\d{10}$)/;

function toNationalNumber(input: string): string | null {
  const stripped = input.trim().replace(/[\s\-().]/g, "");

  if (COUNTRY_CODE_PREFIX.test(stripped)) return stripped.replace(COUNTRY_CODE_PREFIX, "");
  if (TRUNK_PREFIX.test(stripped)) return stripped.replace(TRUNK_PREFIX, "");
  if (LOOKS_LIKE_NATIONAL_NUMBER.test(stripped)) return stripped;

  return null;
}

const LOCAL_DIGIT_LIMIT = 11; // 09XXXXXXXXX
const INTERNATIONAL_DIGIT_LIMIT = 14; // 0063 0 XXXXXXXXXX, the longest accepted form

// For controlled inputs that keep digits only: keeps a leading "+" and caps the
// length by shape, so a typed 63917... or +63917... is never cut short. A
// national number starts with 8 or 9, so "63" and "00" always mean a country code.
export function sanitizePHMobileInput(value: string): string {
  const plus = value.startsWith("+");
  const digits = value.replace(/\D/g, "");
  const international = plus || digits.startsWith("63") || digits.startsWith("00");
  const limit = international ? INTERNATIONAL_DIGIT_LIMIT : LOCAL_DIGIT_LIMIT;

  return `${plus ? "+" : ""}${digits.slice(0, limit)}`;
}

// Any accepted PH mobile format -> the stored 0XXXXXXXXXX form (11 digits;
// input that matches no format comes back stripped of separators, for the
// error path).
export function normalizePHMobile(input: string): string {
  const national = toNationalNumber(input);

  return national ? `0${national}` : input.trim().replace(/[\s\-().]/g, "");
}

// Single rule for web and mobile; the database re-checks the stored format
// (guard_user_profile_values).
export function validatePHMobile(input: string): PHMobileValidation {
  if (!input || input.trim() === "") {
    return { isValid: false, errorMessage: "Mobile number is required.", formattedNumber: null, prefix: null };
  }

  const national = toNationalNumber(input);

  if (!national) {
    return {
      isValid: false,
      errorMessage: "Enter a valid mobile number, like 0917 123 4567 or +63 917 123 4567.",
      formattedNumber: null,
      prefix: null,
    };
  }

  const normalized = `0${national}`;
  const prefix = normalized.slice(0, 4);

  if (!NATIONAL_NUMBER.test(national)) {
    return {
      isValid: false,
      errorMessage: `"${prefix}" is not a mobile prefix. Please enter a valid Philippine mobile number.`,
      formattedNumber: null,
      prefix,
    };
  }

  return { isValid: true, errorMessage: null, formattedNumber: normalized, prefix };
}
