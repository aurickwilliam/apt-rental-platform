import { useState, useCallback } from "react";
import { PH_ZIP_DATABASE } from "@repo/constants";
import type { PHLocation } from "@repo/constants";

// Philippine ZIP codes are exactly 4 digits (1000–9999)
const PH_ZIP_PATTERN = /^\d{4}$/;

function isValidPHZip(zip: string): boolean {
  if (!PH_ZIP_PATTERN.test(zip)) return false;
  const num = parseInt(zip, 10);
  return num >= 1000 && num <= 9999;
}

function lookupLocation(zip: string): PHLocation | null {
  return PH_ZIP_DATABASE.find((loc) => loc.zip === zip) ?? null;
}

interface UsePHPostalCodeReturn {
  /** Current input value */
  value: string;
  /** True when the 4-digit zip passes format AND range check */
  isValid: boolean;
  /** True after the user has blurred the field at least once */
  isTouched: boolean;
  /** Validation error — only shown after the field is touched */
  error: string | null;
  /** Matched location from database (city, province, region), or null */
  location: PHLocation | null;
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
  /** Fires on every change with the new value and validity */
  onChange?: (value: string, isValid: boolean, location: PHLocation | null) => void;
}


function usePHPostalCode(options: UsePHPostalCodeOptions = {}): UsePHPostalCodeReturn {
  const { defaultValue = "", onChange } = options;

  const [value, setValue] = useState<string>(defaultValue);
  const [isTouched, setIsTouched] = useState<boolean>(false);

  const isValid = isValidPHZip(value);
  const location = isValid ? lookupLocation(value) : null;

  const error: string | null = (() => {
    if (!isTouched) return null;
    if (value.length === 0) return "ZIP code is required.";
    if (!/^\d+$/.test(value)) return "ZIP code must contain numbers only.";
    if (value.length !== 4) return "ZIP code must be exactly 4 digits.";
    if (!isValid) return "Invalid Philippine ZIP code (valid range: 1000–9999).";
    if (value.length === 4 && !location) return "ZIP code not found in Philippine database.";
    return null;
  })();

  const handleChange = useCallback(
    (raw: string) => {
      // Strip non-digits and cap at 4 characters
      const cleaned = raw.replace(/\D/g, "").slice(0, 4);
      setValue(cleaned);
      const valid = isValidPHZip(cleaned);
      const loc = valid ? lookupLocation(cleaned) : null;
      onChange?.(cleaned, valid, loc);
    },
    [onChange]
  );

  const handleBlur = useCallback(() => setIsTouched(true), []);

  const validate = useCallback((): boolean => {
    setIsTouched(true);
    return isValidPHZip(value);
  }, [value]);

  const reset = useCallback(() => {
    setValue("");
    setIsTouched(false);
  }, []);

  return {
    value,
    isValid,
    isTouched,
    error,
    location,
    handleChange,
    handleBlur,
    validate,
    reset,
  };
}

export { usePHPostalCode, isValidPHZip, lookupLocation };
export type { UsePHPostalCodeOptions, UsePHPostalCodeReturn };