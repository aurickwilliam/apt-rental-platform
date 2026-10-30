// Keep the database policy versions in sync through a migration when publishing
// a revision. Never infer acceptance from Auth metadata or a remembered checkbox.
export const REGISTRATION_POLICIES = {
  privacy: { version: "1.0", lastUpdated: "January 15, 2026", href: "/pap", label: "Privacy Policy" },
  terms: { version: "1.1", lastUpdated: "October 29, 2026", href: "/tos", label: "Terms and Conditions" },
} as const;

export type RegistrationPolicy = keyof typeof REGISTRATION_POLICIES;

export interface RegistrationAcceptance {
  termsAccepted: boolean;
  privacyAccepted: boolean;
  termsVersion: string;
  privacyVersion: string;
}

export type AcceptanceErrors = Partial<Record<"termsAccepted" | "privacyAccepted" | "version", string>>;

export function emptyRegistrationAcceptance(): RegistrationAcceptance {
  return {
    termsAccepted: false,
    privacyAccepted: false,
    termsVersion: REGISTRATION_POLICIES.terms.version,
    privacyVersion: REGISTRATION_POLICIES.privacy.version,
  };
}

export function validateRegistrationAcceptance(value: unknown): AcceptanceErrors {
  const input = value && typeof value === "object" ? value as Partial<RegistrationAcceptance> : {};
  const errors: AcceptanceErrors = {};
  if (input.privacyAccepted !== true) errors.privacyAccepted = "Please read and accept the Privacy Policy.";
  if (input.termsAccepted !== true) errors.termsAccepted = "Please read and accept the Terms and Conditions.";
  if (input.termsVersion !== REGISTRATION_POLICIES.terms.version || input.privacyVersion !== REGISTRATION_POLICIES.privacy.version) {
    errors.version = "The policies have changed. Reload this page, review the current policies, and accept them again.";
  }
  return errors;
}

export function readRegistrationAcceptance(formData: FormData): RegistrationAcceptance {
  return {
    termsAccepted: formData.get("termsAccepted") === "true",
    privacyAccepted: formData.get("privacyAccepted") === "true",
    termsVersion: String(formData.get("termsVersion") ?? ""),
    privacyVersion: String(formData.get("privacyVersion") ?? ""),
  };
}

export function writeRegistrationAcceptance(formData: FormData, value: RegistrationAcceptance): void {
  formData.set("termsAccepted", String(value.termsAccepted));
  formData.set("privacyAccepted", String(value.privacyAccepted));
  formData.set("termsVersion", value.termsVersion);
  formData.set("privacyVersion", value.privacyVersion);
}

export function getRegistrationAcceptanceErrors(error: { message?: string }): AcceptanceErrors | null {
  if (error.message === "The policies have changed. Reload this page, review the current policies, and accept them again.") {
    return { version: error.message };
  }
  if (error.message === "Please read and accept both policies.") {
    return {
      privacyAccepted: "Please read and accept the Privacy Policy.",
      termsAccepted: "Please read and accept the Terms and Conditions.",
    };
  }
  return null;
}
