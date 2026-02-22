import { useState, useCallback } from "react";

import { PH_MOBILE_PREFIXES } from "@repo/constants";

type PhoneFormat = "09XXXXXXXXX" | "+639XXXXXXXXX" | "639XXXXXXXXX";

interface ValidationResult {
  isValid: boolean;
  errorMessage: string | null;
  formattedNumber: string | null;
  prefix: string | null;
}

interface UsePhilippineMobileValidationReturn {
  value: string;
  validation: ValidationResult;
  onChange: (input: string) => void;
  validate: (input?: string) => ValidationResult;
  reset: () => void;
  formatTo: (format: PhoneFormat) => string | null;
}

/**
 * Normalizes any PH mobile format to a raw 11-digit string starting with "09"
 */
function normalize(input: string): string {
  const stripped = input.trim().replace(/[\s\-().]/g, "");

  if (/^\+639\d{9}$/.test(stripped)) return "0" + stripped.slice(2);  // +639XXXXXXXXX → 09XXXXXXXXX
  if (/^639\d{9}$/.test(stripped))  return "0" + stripped.slice(2);   // 639XXXXXXXXX  → 09XXXXXXXXX
  if (/^9\d{9}$/.test(stripped))    return "0" + stripped;            // 9XXXXXXXXX    → 09XXXXXXXXX
  if (/^09\d{9}$/.test(stripped))   return stripped;                  // Already 09XXXXXXXXX

  return stripped;
}

function runValidation(input: string): ValidationResult {
  if (!input || input.trim() === "") {
    return { isValid: false, errorMessage: "Mobile number is required.", formattedNumber: null, prefix: null };
  }

  const normalized = normalize(input);

  if (!/^09\d{9}$/.test(normalized)) {
    return {
      isValid: false,
      errorMessage: "Invalid format. Use 09XXXXXXXXX, +639XXXXXXXXX, or 639XXXXXXXXX.",
      formattedNumber: null,
      prefix: null,
    };
  }

  const prefix = normalized.slice(0, 4);
  const isKnownPrefix = PH_MOBILE_PREFIXES.includes(prefix);

  if (!isKnownPrefix) {
    return {
      isValid: false,
      errorMessage: `Unknown mobile prefix "${prefix}". Please enter a valid Philippine mobile number.`,
      formattedNumber: null,
      prefix,
    };
  }

  return {
    isValid: true,
    errorMessage: null,
    formattedNumber: normalized,
    prefix,
  };
}

/**
 * usePhilippineMobileValidation
 *
 * A custom hook for validating Philippine mobile numbers.
 *
 * Accepted formats:
 *  - 09XXXXXXXXX
 *  - +639XXXXXXXXX
 *  - 639XXXXXXXXX
 *  - 9XXXXXXXXX
 *  - With separators: 0917-123-4567, 0917 123 4567
 *
 * @example
 * const { value, validation, onChange } = usePHMobileValidation();
 *
 * <input value={value} onChange={(e) => onChange(e.target.value)} />
 * {!validation.isValid && <span>{validation.errorMessage}</span>}
 */
export function usePHMobileValidation(
  initialValue: string = ""
): UsePhilippineMobileValidationReturn {

  const [value, setValue] = useState<string>(initialValue);
  const [validation, setValidation] = useState<ValidationResult>(() =>
    initialValue ? runValidation(initialValue) : { isValid: false, errorMessage: null, formattedNumber: null, prefix: null }
  );

  const validate = useCallback((input?: string): ValidationResult => {
    const target = input !== undefined ? input : value;
    const result = runValidation(target);
    setValidation(result);
    return result;
  }, [value]);

  const onChange = useCallback((input: string) => {
    setValue(input);
    const result = runValidation(input);
    setValidation(result);
  }, []);

  const reset = useCallback(() => {
    setValue("");
    setValidation({ isValid: false, errorMessage: null, formattedNumber: null, prefix: null });
  }, []);

  const formatTo = useCallback((format: PhoneFormat): string | null => {
    if (!validation.formattedNumber) return null;
    const normalized = validation.formattedNumber; // 09XXXXXXXXX
    switch (format) {
      case "09XXXXXXXXX":    return normalized;
      case "+639XXXXXXXXX":  return "+63" + normalized.slice(1);
      case "639XXXXXXXXX":   return "63"  + normalized.slice(1);
      default:               return normalized;
    }
  }, [validation.formattedNumber]);

  return { value, validation, onChange, validate, reset, formatTo };
}

export type { ValidationResult, PhoneFormat, UsePhilippineMobileValidationReturn };