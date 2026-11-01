import { TERMS_POLICY } from "@/constants/legal/terms";
import { PRIVACY_POLICY } from "@/constants/legal/privacy";

export interface RegistrationAcceptance {
  termsAccepted: boolean;
  privacyAccepted: boolean;
  termsVersion: string;
  privacyVersion: string;
}

export type AcceptanceField = "termsAccepted" | "privacyAccepted";
export type AcceptanceErrors = Partial<Record<AcceptanceField | "version", string>>;

export const POLICY_UPDATE_MESSAGE = "The policies have changed. Update the app, review the current policies, and accept them again.";

export function emptyRegistrationAcceptance(): RegistrationAcceptance {
  return {
    termsAccepted: false,
    privacyAccepted: false,
    termsVersion: TERMS_POLICY.version,
    privacyVersion: PRIVACY_POLICY.version,
  };
}

export function validateRegistrationAcceptance(value: unknown): AcceptanceErrors {
  const input = value && typeof value === "object" ? value as Partial<RegistrationAcceptance> : {};
  const errors: AcceptanceErrors = {};
  if (input.privacyAccepted !== true) errors.privacyAccepted = "Please read and accept the Privacy Policy.";
  if (input.termsAccepted !== true) errors.termsAccepted = "Please read and accept the Terms and Conditions.";
  if (input.termsVersion !== TERMS_POLICY.version || input.privacyVersion !== PRIVACY_POLICY.version) {
    errors.version = POLICY_UPDATE_MESSAGE;
  }
  return errors;
}

export class RegistrationAcceptanceError extends Error {
  constructor(public readonly errors: AcceptanceErrors) {
    super(errors.version ?? errors.privacyAccepted ?? errors.termsAccepted ?? "Please read and accept both policies.");
    this.name = "RegistrationAcceptanceError";
  }
}

export function requireRegistrationAcceptance(value: unknown): asserts value is RegistrationAcceptance {
  const errors = validateRegistrationAcceptance(value);
  if (Object.keys(errors).length) throw new RegistrationAcceptanceError(errors);
}

export function getRegistrationAcceptanceErrors(error: unknown): AcceptanceErrors | null {
  if (error instanceof RegistrationAcceptanceError) return error.errors;
  if (!error || typeof error !== "object" || !("message" in error)) return null;
  if (error.message === POLICY_UPDATE_MESSAGE) return { version: POLICY_UPDATE_MESSAGE };
  if (error.message === "Please read and accept both policies.") {
    return {
      privacyAccepted: "Please read and accept the Privacy Policy.",
      termsAccepted: "Please read and accept the Terms and Conditions.",
    };
  }
  return null;
}
