// Two-step login (authenticator-app codes) for admin accounts. Pure decision
// so it can be tested; the Auth reads live in lib/server-admin-mfa.ts.
//
// A session is "aal1" after the password (or Google) and "aal2" once a TOTP
// code has been verified. Admin pages need aal2 when ADMIN_MFA_REQUIRED is on;
// the database repeats the check for admin data (see docs/admin-provisioning.md).

export const ADMIN_MFA_PATH = "/two-step-login";
export const ADMIN_HOME = "/admin/dashboard";

export type AssuranceLevel = "aal1" | "aal2";
export type AdminMfaDecision = "ok" | "enroll" | "challenge";

export interface AdminMfaInput {
  required: boolean;
  currentLevel: AssuranceLevel;
  hasVerifiedFactor: boolean;
}

export function adminMfaDecision({
  required,
  currentLevel,
  hasVerifiedFactor,
}: AdminMfaInput): AdminMfaDecision {
  if (!required) return "ok";
  if (currentLevel === "aal2") return "ok";
  return hasVerifiedFactor ? "challenge" : "enroll";
}

// Anything that is not exactly "true" keeps the check off, so a typo can never
// lock admins out.
export function isAdminMfaRequired(value: string | undefined): boolean {
  return value === "true";
}

// The token's claim is the only trusted source for the level.
export function toAssuranceLevel(claim: unknown): AssuranceLevel {
  return claim === "aal2" ? "aal2" : "aal1";
}
