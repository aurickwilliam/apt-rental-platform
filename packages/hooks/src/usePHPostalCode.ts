import { useState, useCallback } from "react";
import { getZipCityWarning } from "@repo/constants";

// Philippine ZIP codes are exactly 4 digits (1000–9999)
const PH_ZIP_PATTERN = /^\d{4}$/;

function isValidPHZip(zip: string): boolean {
  if (!PH_ZIP_PATTERN.test(zip)) return false;
  const num = parseInt(zip, 10);
  return num >= 1000 && num <= 9999;
}

interface UsePHPostalCodeReturn {
  /** Current input value */
  value: string;
  /** Imperatively set the value (e.g. for resetting) */
  setValue: (value: string) => void;
  /** True when the value is a 4-digit ZIP (1000–9999); a city mismatch only warns */
  isValid: boolean;
  /** True after the user has blurred the field at least once */
  isTouched: boolean;
  /** Validation error — only shown after the field is touched */
  error: string | null;
  /** Non-blocking note when a well-formed ZIP is not one we recognize for the city */
  warning: string | null;
  /** Attach to onChange / onChangeText */
  handleChange: (value: string) => void;
  /** Attach to onBlur */
  handleBlur: () => void;
  /** Imperatively validate — call on form submit; returns isValid */
  validate: () => boolean;
  /** Reset field to initial state */
  reset: () => void;
}

interface UsePHPostalCodeOptions {
  /** Initial value */
  defaultValue?: string;
  /** When both are set, a ZIP we do not recognize for this city gets a warning (never an error) */
  city?: string;
  province?: string;
  /** Fires on every change with the new value and validity */
  onChange?: (value: string, isValid: boolean) => void;
}


function usePHPostalCode(options: UsePHPostalCodeOptions = {}): UsePHPostalCodeReturn {
  const { defaultValue = "", onChange, city, province } = options;

  const [value, setValue] = useState<string>(defaultValue);
  const [isTouched, setIsTouched] = useState<boolean>(false);

  const isValid = isValidPHZip(value);
  const warning = city && province && isValid ? getZipCityWarning(city, province, value) : null;

  const error: string | null = (() => {
    if (!isTouched) return null;
    if (value.length === 0) return "ZIP code is required.";
    if (!/^\d+$/.test(value)) return "ZIP code must contain numbers only.";
    if (value.length !== 4) return "ZIP code must be exactly 4 digits.";
    if (!isValid) return "Invalid Philippine ZIP code (valid range: 1000–9999).";
    return null;
  })();

  const handleChange = useCallback(
    (raw: string) => {
      // Strip non-digits and cap at 4 characters
      const cleaned = raw.replace(/\D/g, "").slice(0, 4);
      setValue(cleaned);
      onChange?.(cleaned, isValidPHZip(cleaned));
    },
    [onChange]
  );

  const handleBlur = useCallback(() => setIsTouched(true), []);

  const validate = useCallback((): boolean => {
    setIsTouched(true);
    return isValid;
  }, [isValid]);

  const reset = useCallback(() => {
    setValue("");
    setIsTouched(false);
  }, []);

  return {
    value,
    setValue,
    isValid,
    isTouched,
    error,
    warning,
    handleChange,
    handleBlur,
    validate,
    reset,
  };
}

export { usePHPostalCode, isValidPHZip };
export type { UsePHPostalCodeOptions, UsePHPostalCodeReturn };
