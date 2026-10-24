import { useState, useCallback } from "react";

import { validatePHMobile, type PHMobileValidation } from "@repo/constants";

type PhoneFormat = "09XXXXXXXXX" | "+639XXXXXXXXX" | "639XXXXXXXXX";

type ValidationResult = PHMobileValidation;

interface UsePhilippineMobileValidationReturn {
  value: string;
  validation: ValidationResult;
  onChange: (input: string) => void;
  validate: (input?: string) => ValidationResult;
  reset: () => void;
  formatTo: (format: PhoneFormat) => string | null;
}

const runValidation = validatePHMobile;

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