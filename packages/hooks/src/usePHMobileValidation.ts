import { useState, useCallback } from "react";

import { formatPHMobileInput, validatePHMobile, type PHMobileValidation } from "@repo/constants";

type ValidationResult = PHMobileValidation;

interface UsePhilippineMobileValidationReturn {
  value: string;
  validation: ValidationResult;
  onChange: (input: string) => void;
  validate: (input?: string) => ValidationResult;
  reset: () => void;
}

const runValidation = validatePHMobile;

export function usePHMobileValidation(
  initialValue: string = ""
): UsePhilippineMobileValidationReturn {

  // The field shows "0917 123 4567" while it stores 09171234567.
  const [value, setValue] = useState<string>(() => formatPHMobileInput(initialValue));
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
    const formatted = formatPHMobileInput(input);
    setValue(formatted);
    setValidation(runValidation(formatted));
  }, []);

  const reset = useCallback(() => {
    setValue("");
    setValidation({ isValid: false, errorMessage: null, formattedNumber: null, prefix: null });
  }, []);

  return { value, validation, onChange, validate, reset };
}

export type { ValidationResult, UsePhilippineMobileValidationReturn };