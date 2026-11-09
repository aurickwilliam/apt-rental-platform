import { useState } from "react";
import {
  emptyRegistrationAcceptance,
  getRegistrationAcceptanceErrors,
  validateRegistrationAcceptance,
  type AcceptanceErrors,
  type AcceptanceField,
} from "@/service/auth/registrationAcceptance";

export function useRegistrationAcceptance() {
  const [value, setValue] = useState(emptyRegistrationAcceptance);
  const [errors, setErrors] = useState<AcceptanceErrors>({});

  const setAccepted = (field: AcceptanceField, selected: boolean) => {
    setValue((current) => ({ ...current, [field]: selected }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  };

  const validate = () => {
    const next = validateRegistrationAcceptance(value);
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleError = (error: unknown) => {
    const next = getRegistrationAcceptanceErrors(error);
    if (!next) return false;
    setValue(emptyRegistrationAcceptance());
    setErrors(next);
    return true;
  };

  return {
    value, errors, setAccepted, validate, handleError,
    canSubmit: value.termsAccepted && value.privacyAccepted && !errors.version,
  };
}

export type RegistrationAcceptanceForm = ReturnType<typeof useRegistrationAcceptance>;
