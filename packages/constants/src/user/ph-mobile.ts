export interface PHMobileValidation {
  isValid: boolean;
  errorMessage: string | null;
  formattedNumber: string | null;
  prefix: string | null;
}

// Longest thing the field holds: "0917 123 4567" (11 digits plus two spaces).
export const PH_MOBILE_MAX_INPUT_LENGTH = 13;

// Mobile numbers are a 10-digit national number after the leading 0.
// The NTC mobile range is the whole 9XX block (0900-0999), so every 9XX prefix
// is accepted: operators are issued new blocks (0924/0925/0934/0944 in 2025)
// faster than any list can follow, and number portability means the prefix no
// longer identifies the operator anyway. The 8XX series is allocated in a few
// blocks only (Smart 813, Globe 817, DITO 895-899), so those stay explicit.
const NATIONAL_NUMBER = /^(9\d{2}|813|817|89[5-9])\d{7}$/;

// Only the local format is accepted: 11 digits with the leading 0, typed with
// or without the spaces the field adds ("0917 123 4567"). +63 / 63 forms are not.
const LOCAL_NUMBER = /^0\d{10}$/;

const stripSeparators = (input: string) => input.trim().replace(/[\s\-().]/g, "");

function toNationalNumber(input: string): string | null {
  const stripped = stripSeparators(input);

  return LOCAL_NUMBER.test(stripped) ? stripped.slice(1) : null;
}

const LOCAL_DIGIT_LIMIT = 11; // 09XXXXXXXXX

export const PH_MOBILE_TOO_SHORT_MESSAGE = `Mobile number must be ${LOCAL_DIGIT_LIMIT} digits, like 0917 123 4567.`;

// For controlled inputs: keeps digits only (at most 11) and spaces them as
// "XXXX XXX XXXX" while typing. No trailing space is added, so Backspace always
// removes a digit.
export function formatPHMobileInput(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, LOCAL_DIGIT_LIMIT);

  return [digits.slice(0, 4), digits.slice(4, 7), digits.slice(7)].filter(Boolean).join(" ");
}

// An accepted PH mobile number -> the stored 0XXXXXXXXXX form (11 digits;
// input that is not valid comes back stripped of separators, for the error
// path).
export function normalizePHMobile(input: string): string {
  const national = toNationalNumber(input);

  return national ? `0${national}` : stripSeparators(input);
}

// Single rule for web and mobile; the database re-checks the stored format
// (guard_user_profile_values).
export function validatePHMobile(input: string): PHMobileValidation {
  if (!input || input.trim() === "") {
    return { isValid: false, errorMessage: "Mobile number is required.", formattedNumber: null, prefix: null };
  }

  const national = toNationalNumber(input);

  const stripped = stripSeparators(input);

  if (/^\d+$/.test(stripped) && stripped.length < LOCAL_DIGIT_LIMIT) {
    return { isValid: false, errorMessage: PH_MOBILE_TOO_SHORT_MESSAGE, formattedNumber: null, prefix: null };
  }

  if (!national) {
    return {
      isValid: false,
      errorMessage: "Enter a valid mobile number, like 0917 123 4567.",
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
