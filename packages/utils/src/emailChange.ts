import { type AuthIdentityUser, hasEmailPasswordIdentity } from "./authIdentity";
import { describeAuthError, type AuthErrorLike } from "./passwordErrors";
import { isValidEmail } from "./validateEmail";
import { translate, type LanguageCode, type TranslationKey } from "@repo/i18n";

// Change email while signed in, shared by mobile (emailChangeService) and web
// (the change-email server actions), each passing its own Supabase auth.
//
// Supabase Auth is canonical: updateUser({ email }) requests the change and
// Supabase sends confirmation codes to both the current and the new inbox
// when Secure Email Change is enabled. The current address stays active until
// both are confirmed with verifyOtp({ type: "email_change" }). The app never
// writes the new address into public.users directly; a server-side function
// copies the canonical auth.users.email after Auth commits it.
//
// The current password is an app-flow check, not a server-enforced one: it is
// verified with signInWithPassword before updateUser, mirroring changePasswordWith.

export type EmailChangeErrorReason =
  | "invalid_email"
  | "same_email"
  | "not_eligible"
  | "wrong_current_password"
  | "invalid_or_expired_code"
  | "rate_limited"
  | "session_expired"
  | "reauthentication_required"
  | "email_unavailable"
  | "suspended"
  | "no_pending_change"
  | "network"
  | "unknown";

const EMAIL_CHANGE_ERROR_KEYS: Record<EmailChangeErrorReason, TranslationKey> = {
  invalid_email: "validation.email.invalid",
  same_email: "auth.error.sameEmail",
  not_eligible: "auth.error.notEligible",
  wrong_current_password: "auth.error.wrongCurrentPassword",
  invalid_or_expired_code: "auth.error.invalidOrExpiredCode",
  rate_limited: "auth.error.rateLimited",
  session_expired: "auth.error.sessionExpiredGeneric",
  reauthentication_required: "auth.error.reauthenticationEmail",
  // Generic on purpose: never reveal whether an address is registered.
  email_unavailable: "auth.error.emailUnavailable",
  suspended: "auth.error.suspended",
  no_pending_change: "auth.error.noPendingChange",
  network: "auth.error.network",
  unknown: "errors.generic",
};

export function emailChangeErrorKey(reason: EmailChangeErrorReason): TranslationKey {
  return EMAIL_CHANGE_ERROR_KEYS[reason];
}

/** User-facing copy for an email-change failure, in the active language. */
export function emailChangeErrorMessage(
  language: LanguageCode,
  reason: EmailChangeErrorReason,
): string {
  return translate(language, EMAIL_CHANGE_ERROR_KEYS[reason]);
}

export class EmailChangeError extends Error {
  readonly reason: EmailChangeErrorReason;

  constructor(reason: EmailChangeErrorReason) {
    // Developer-facing only: UI copy comes from `emailChangeErrorMessage`.
    super(reason);
    this.name = "EmailChangeError";
    this.reason = reason;
  }
}

const INVALID_CODE_ERRORS = new Set([
  "otp_expired",
  "otp_disabled",
  "invalid_grant",
  "expired_token",
  "token_not_found",
]);
const RATE_LIMIT_ERRORS = new Set(["over_email_send_rate_limit", "over_request_rate_limit"]);
const SESSION_ERRORS = new Set(["session_not_found", "session_expired"]);
const INVALID_EMAIL_ERRORS = new Set(["email_address_invalid", "validation_failed"]);
const UNAVAILABLE_EMAIL_ERRORS = new Set([
  "email_exists",
  "email_taken",
  "user_already_exists",
  "email_conflict_identity_not_deletable",
  "email_address_not_authorized",
]);
const RATE_LIMIT_STATUS = 429;

export function toEmailChangeErrorReason(error: unknown): EmailChangeErrorReason {
  if (!error || typeof error !== "object") return "unknown";
  const { name, code, status } = error as AuthErrorLike;

  if (code && INVALID_CODE_ERRORS.has(code)) return "invalid_or_expired_code";
  if (code === "invalid_credentials") return "wrong_current_password";
  if ((code && RATE_LIMIT_ERRORS.has(code)) || status === RATE_LIMIT_STATUS) return "rate_limited";
  if (code === "reauthentication_needed") return "reauthentication_required";
  if ((code && SESSION_ERRORS.has(code)) || name === "AuthSessionMissingError")
    return "session_expired";
  if (code && UNAVAILABLE_EMAIL_ERRORS.has(code)) return "email_unavailable";
  if (code && INVALID_EMAIL_ERRORS.has(code)) return "invalid_email";
  if (name === "AuthRetryableFetchError") return "network";
  return "unknown";
}

// Safe-to-log fields only. Never log the message or the inputs: Auth error
// messages can echo the email address, and callers' errors can carry
// passwords or codes.
export function toEmailChangeError(error: unknown, context: string): EmailChangeError {
  const reason = toEmailChangeErrorReason(error);
  if (reason === "unknown") {
    console.error(`${context} failed:`, describeAuthError(error));
  }
  return new EmailChangeError(reason);
}

// 6-digit codes, mirroring hosted Auth (mailer_otp_length) and
// supabase/config.toml [auth.email], like the recovery flow.
export const EMAIL_CHANGE_CODE_LENGTH = 6;
export const EMAIL_CHANGE_RESEND_COOLDOWN_SECONDS = 60;

const EMAIL_CHANGE_CODE_PATTERN = new RegExp(`^\\d{${EMAIL_CHANGE_CODE_LENGTH}}$`);

export function isEmailChangeCodeFormat(code: string): boolean {
  return EMAIL_CHANGE_CODE_PATTERN.test(code.trim());
}

// Trims and validates a candidate new address; throws
// EmailChangeError("invalid_email"). Callers compare against the canonical
// current address separately so the same-address message stays distinct.
export function normalizeEmailChangeEmail(email: string): string {
  const trimmed = email.trim();
  if (!isValidEmail(trimmed)) throw new EmailChangeError("invalid_email");
  return trimmed;
}

interface EmailChangeIdentityUser extends AuthIdentityUser {
  id: string;
  email?: string | null;
  new_email?: string | null;
}

function hasGoogleIdentity(user: AuthIdentityUser): boolean {
  if (user.identities?.some((identity) => identity.provider === "google")) return true;
  const providers = user.app_metadata?.providers;
  return Array.isArray(providers) && providers.includes("google");
}

// Stricter than change-password on purpose: only an email/password account
// with no Google identity may change its email here. Linked Google + password
// accounts are excluded (they keep signing in with Google).
export function isEligibleForEmailChange(user: AuthIdentityUser): boolean {
  return hasEmailPasswordIdentity(user) && !hasGoogleIdentity(user);
}

export type EmailChangeErrorField = "new" | "current" | "code" | "general";

// Where a change-email form shows an error: under the new-email field, under
// the current-password field, under the code field, or as a general
// (dialog/banner) error.
export function getEmailChangeErrorField(reason: EmailChangeErrorReason): EmailChangeErrorField {
  if (reason === "wrong_current_password") return "current";
  if (reason === "invalid_email" || reason === "same_email" || reason === "email_unavailable")
    return "new";
  if (reason === "invalid_or_expired_code" || reason === "rate_limited") return "code";
  return "general";
}

// Structural subset of Supabase's auth client: only the calls used here, so
// this package needs no Supabase dependency.
export interface EmailChangeAuth {
  getUser(): Promise<{ data: { user: EmailChangeIdentityUser | null }; error: unknown }>;
  signInWithPassword(credentials: {
    email: string;
    password: string;
  }): Promise<{ data: { user: { id: string } | null }; error: unknown }>;
  updateUser(attributes: { email: string }): Promise<{ error: unknown }>;
  verifyOtp(input: {
    email: string;
    token: string;
    type: "email_change";
  }): Promise<{ data: { user: EmailChangeIdentityUser | null }; error: unknown }>;
  resend(input: {
    type: "email_change";
    email: string;
  }): Promise<{ error: unknown }>;
  signOut(options: { scope: "others" }): Promise<{ error: unknown }>;
}

export interface EmailChangeRequest {
  currentEmail: string;
  newEmail: string;
}

// Requests an email change: verifies the current password, then asks Auth to
// send confirmation codes to both inboxes. Returns the canonical addresses so
// the form can label each code field. Never returns codes or tokens.
export async function requestEmailChangeWith(
  auth: EmailChangeAuth,
  newEmailInput: string,
  currentPassword: string,
): Promise<EmailChangeRequest> {
  if (typeof currentPassword !== "string" || currentPassword.length === 0) {
    throw new EmailChangeError("wrong_current_password");
  }
  const newEmail = normalizeEmailChangeEmail(newEmailInput);

  const { data: userData, error: userError } = await auth.getUser();
  const user = userData.user;
  if (userError || !user) throw toEmailChangeError(userError, "Email change account lookup");
  if (!user.email || !isEligibleForEmailChange(user)) {
    console.error("Email change attempted on an ineligible account.");
    throw new EmailChangeError("not_eligible");
  }
  if (newEmail.toLowerCase() === user.email.toLowerCase()) {
    throw new EmailChangeError("same_email");
  }

  // Verifying signs in again as the same user and replaces this session; the
  // previous session is ended with the others after both codes confirm.
  const { data: verified, error: verifyError } = await auth.signInWithPassword({
    email: user.email,
    password: currentPassword,
  });
  if (verifyError) throw toEmailChangeError(verifyError, "Email change verification");
  if (verified.user?.id !== user.id) {
    console.error("Email change verification returned a different account.");
    throw new EmailChangeError("unknown");
  }

  const { error: updateError } = await auth.updateUser({ email: newEmail });
  if (updateError) throw toEmailChangeError(updateError, "Email change request");

  return { currentEmail: user.email, newEmail };
}

export interface EmailChangeStatus {
  userId: string;
  email: string;
  pendingNewEmail: string | null;
}

// Reads the canonical Auth state: the active address and any pending change
// (auth.users.new_email). Callers resume or restart from this, never from
// saved form state.
export async function getEmailChangeStatus(auth: EmailChangeAuth): Promise<EmailChangeStatus> {
  const { data, error } = await auth.getUser();
  const user = data.user;
  if (error || !user || !user.email) throw toEmailChangeError(error, "Email change status lookup");
  if (!isEligibleForEmailChange(user)) {
    console.error("Email change status read on an ineligible account.");
    throw new EmailChangeError("not_eligible");
  }
  const pending = typeof user.new_email === "string" && user.new_email.length > 0 ? user.new_email : null;
  return { userId: user.id, email: user.email, pendingNewEmail: pending };
}

export interface EmailChangeVerification {
  completed: boolean;
  email: string;
  pendingNewEmail: string | null;
}

// Which inbox a code came from: the current (canonical) address or the
// pending new one. The addresses themselves are read from Auth, never taken
// from the client, so a code is always paired with this account's inbox.
export type EmailChangeInbox = "current" | "new";

function sameEmail(a: string, b: string): boolean {
  return a.trim().toLowerCase() === b.trim().toLowerCase();
}

// Verifies one inbox code with type "email_change", then re-reads Auth.
// Supabase uses up an accepted code, so callers track which inbox is already
// confirmed and never send that code again. Completed only when the same
// account's canonical address is now the pending address and nothing is left
// pending. intendedNewEmail (the address the form shows) guards against a
// change that another device replaced in the meantime.
export async function verifyEmailChangeCodeWith(
  auth: EmailChangeAuth,
  inbox: EmailChangeInbox,
  codeInput: string,
  intendedNewEmailInput?: string,
): Promise<EmailChangeVerification> {
  const token = codeInput.trim();
  if (!isEmailChangeCodeFormat(token)) {
    throw new EmailChangeError("invalid_or_expired_code");
  }

  const before = await getEmailChangeStatus(auth);
  const pending = before.pendingNewEmail;
  if (!pending) throw new EmailChangeError("no_pending_change");
  if (intendedNewEmailInput !== undefined && !sameEmail(intendedNewEmailInput, pending)) {
    throw new EmailChangeError("no_pending_change");
  }

  const { error: verifyError } = await auth.verifyOtp({
    email: inbox === "current" ? before.email : pending,
    token,
    type: "email_change",
  });
  if (verifyError) throw toEmailChangeError(verifyError, "Email change verification");

  const after = await getEmailChangeStatus(auth);
  if (after.userId !== before.userId) {
    console.error("Email change verification returned a different account.");
    throw new EmailChangeError("unknown");
  }
  if (after.pendingNewEmail !== null) {
    return { completed: false, email: after.email, pendingNewEmail: after.pendingNewEmail };
  }
  if (!sameEmail(after.email, pending)) {
    console.error("Email change verification left an unexpected canonical address.");
    throw new EmailChangeError("unknown");
  }
  return { completed: true, email: after.email, pendingNewEmail: null };
}

// Resends the confirmation codes. Supabase looks the account up by its
// current address and then issues new codes for BOTH inboxes (any earlier
// code, or a confirmation already made, no longer counts), so there is one
// resend for the whole change. Supabase enforces its own rate limits; the UI
// cooldown is feedback only, not a security boundary.
export async function resendEmailChangeCodesWith(auth: EmailChangeAuth): Promise<void> {
  const status = await getEmailChangeStatus(auth);
  if (!status.pendingNewEmail) throw new EmailChangeError("no_pending_change");
  const { error } = await auth.resend({ type: "email_change", email: status.email });
  if (error) throw toEmailChangeError(error, "Email change resend");
}

// Ends every other session after both codes confirm. The email has already
// changed, so a failure is reported (not thrown) for honest UI copy.
export async function signOutOtherSessionsAfterEmailChange(
  auth: EmailChangeAuth,
): Promise<{ signOutFailed: boolean }> {
  const { error } = await auth.signOut({ scope: "others" });
  if (error) {
    console.error(
      "Signing out other sessions after an email change failed:",
      describeAuthError(error),
    );
    return { signOutFailed: true };
  }
  return { signOutFailed: false };
}
