import { type AuthIdentityUser, hasEmailPasswordIdentity } from "./authIdentity";
import { describeAuthError, type AuthErrorLike } from "./passwordErrors";
import { isValidEmail } from "./validateEmail";

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
  | "network"
  | "unknown";

const EMAIL_CHANGE_ERROR_MESSAGES: Record<EmailChangeErrorReason, string> = {
  invalid_email: "Enter a valid email address.",
  same_email: "Enter a different email address from your current one.",
  not_eligible: "Only email and password accounts can change their email.",
  wrong_current_password: "Your current password is incorrect.",
  invalid_or_expired_code:
    "That code is incorrect or has expired. Check the code or request a new one.",
  rate_limited: "Too many attempts. Please wait a minute before trying again.",
  session_expired: "Your session has expired. Please sign in again.",
  reauthentication_required: "For your security, please sign in again before changing your email.",
  // Generic on purpose: never reveal whether an address is registered.
  email_unavailable: "This email address can't be used. Try a different one.",
  suspended: "Your account is suspended and can't change its email.",
  network: "Can't connect right now. Check your internet connection and try again.",
  unknown: "Something went wrong. Please try again.",
};

export class EmailChangeError extends Error {
  readonly reason: EmailChangeErrorReason;

  constructor(reason: EmailChangeErrorReason) {
    super(EMAIL_CHANGE_ERROR_MESSAGES[reason]);
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

// Verifies one inbox code (current or new address) with type "email_change",
// then re-reads Auth. Completed only when no pending change remains or the
// canonical address equals the intended new address for the same account.
export async function verifyEmailChangeCodeWith(
  auth: EmailChangeAuth,
  inboxEmailInput: string,
  codeInput: string,
  intendedNewEmailInput?: string,
): Promise<EmailChangeVerification> {
  const inboxEmail = normalizeEmailChangeEmail(inboxEmailInput);
  const token = codeInput.trim();
  if (!isEmailChangeCodeFormat(token)) {
    throw new EmailChangeError("invalid_or_expired_code");
  }

  const before = await getEmailChangeStatus(auth);

  const { error: verifyError } = await auth.verifyOtp({
    email: inboxEmail,
    token,
    type: "email_change",
  });
  if (verifyError) throw toEmailChangeError(verifyError, "Email change verification");

  const after = await getEmailChangeStatus(auth);
  if (after.userId !== before.userId) {
    console.error("Email change verification returned a different account.");
    throw new EmailChangeError("unknown");
  }

  const intended = intendedNewEmailInput?.trim().toLowerCase() ?? after.pendingNewEmail?.toLowerCase() ?? null;
  const completed =
    after.pendingNewEmail === null ||
    (intended !== null && after.email.toLowerCase() === intended);
  return { completed, email: after.email, pendingNewEmail: after.pendingNewEmail };
}

// Resends the confirmation code to one inbox. Supabase enforces its own rate
// limits; the UI cooldown is feedback only, not a security boundary.
export async function resendEmailChangeCodeWith(
  auth: EmailChangeAuth,
  inboxEmailInput: string,
): Promise<void> {
  const inboxEmail = normalizeEmailChangeEmail(inboxEmailInput);
  await getEmailChangeStatus(auth);
  const { error } = await auth.resend({ type: "email_change", email: inboxEmail });
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
