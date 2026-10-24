import { PH_MOBILE_PREFIXES } from "./ph-mobile-prefixes";

export interface PHMobileValidation {
  isValid: boolean;
  errorMessage: string | null;
  formattedNumber: string | null;
  prefix: string | null;
}

// Any accepted PH mobile format -> the stored 09XXXXXXXXX form (input that
// matches no format comes back stripped of separators, for the error path).
export function normalizePHMobile(input: string): string {
  const stripped = input.trim().replace(/[\s\-().]/g, "");

  if (/^\+639\d{9}$/.test(stripped)) return "0" + stripped.slice(3); // +639XXXXXXXXX
  if (/^639\d{9}$/.test(stripped)) return "0" + stripped.slice(2); // 639XXXXXXXXX
  if (/^9\d{9}$/.test(stripped)) return "0" + stripped; // 9XXXXXXXXX
  if (/^09\d{9}$/.test(stripped)) return stripped; // already 09XXXXXXXXX

  return stripped;
}

// Single rule for web and mobile; the database re-checks the stored format
// (guard_user_profile_values).
export function validatePHMobile(input: string): PHMobileValidation {
  if (!input || input.trim() === "") {
    return { isValid: false, errorMessage: "Mobile number is required.", formattedNumber: null, prefix: null };
  }

  const normalized = normalizePHMobile(input);

  if (!/^09\d{9}$/.test(normalized)) {
    return {
      isValid: false,
      errorMessage: "Invalid format. Use 09XXXXXXXXX, +639XXXXXXXXX, or 639XXXXXXXXX.",
      formattedNumber: null,
      prefix: null,
    };
  }

  const prefix = normalized.slice(0, 4);

  if (!PH_MOBILE_PREFIXES.includes(prefix)) {
    return {
      isValid: false,
      errorMessage: `Unknown mobile prefix "${prefix}". Please enter a valid Philippine mobile number.`,
      formattedNumber: null,
      prefix,
    };
  }

  return { isValid: true, errorMessage: null, formattedNumber: normalized, prefix };
}
