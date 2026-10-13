"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { createClient } from "@repo/supabase/server";
import {
  createRecoveryMarkerValue,
  isSupabaseAuthCookie,
  readRecoveryMarker,
  RECOVERY_MARKER_COOKIE,
  RECOVERY_MARKER_COOKIE_OPTIONS,
  RECOVERY_UPDATED_PATH,
} from "@repo/supabase/password-recovery";
import {
  describeAuthError,
  hasEmailPasswordIdentity,
  isRecoveryCodeFormat,
  normalizeRecoveryEmail,
  PasswordError,
  type PasswordErrorReason,
  toPasswordError,
  toPasswordErrorReason,
} from "@repo/utils";

import { PORTAL_COOKIE } from "@/lib/portal-preference";

// Password recovery by 6-digit email code, mirroring mobile
// (service/auth/passwordRecoveryService.ts): resetPasswordForEmail sends the
// code, verifyOtp({ type: "recovery" }) turns it into a full session in the
// Auth cookies, and updateUser sets the new password.
//
// The recovery marker cookie (written before verifying) limits that session to
// the reset page; the middleware signs out a recovery left unfinished. Server
// actions skip the middleware, so updateRecoveredPassword checks it itself.
// Google-only accounts are an app-flow rule checked only after verification,
// so the request step never reveals whether an account exists.

type Supabase = Awaited<ReturnType<typeof createClient>>;

export type RecoveryRequestResult = { error: PasswordErrorReason | null };
export type RecoveryVerifyResult =
  | { status: "ready" | "google_only"; error?: never }
  | { status?: never; error: PasswordErrorReason };

function errorReason(error: unknown, context: string): PasswordErrorReason {
  if (error instanceof PasswordError) return error.reason;
  return toPasswordError(error, context).reason;
}

// Expired on the root path, where the Auth cookies and the marker live.
async function expireCookie(name: string): Promise<void> {
  (await cookies()).set(name, "", { path: "/", maxAge: 0 });
}

// Ends the recovery session. "local" (abandoning the flow) signs out only this
// browser; "global" (after a successful reset) signs the account out
// everywhere. Remote revocation is best-effort, but the browser's Auth cookies
// never survive: signOut keeps them when it cannot read the session, so they
// are expired directly in that case.
async function endPasswordRecovery(supabase: Supabase, scope: "local" | "global"): Promise<void> {
  await expireCookie(RECOVERY_MARKER_COOKIE);
  await expireCookie(PORTAL_COOKIE);

  const { error } = await supabase.auth.signOut({ scope });
  if (!error) return;
  if (toPasswordErrorReason(error) !== "network") {
    console.error("Password recovery sign-out failed:", describeAuthError(error));
  }
  const cookieStore = await cookies();
  for (const { name } of cookieStore.getAll()) {
    if (isSupabaseAuthCookie(name)) cookieStore.set(name, "", { path: "/", maxAge: 0 });
  }
}

// Sends (or resends) a recovery code. auth.resend() does not support recovery
// codes, so resend calls this again. Unknown accounts get the same answer.
export async function requestPasswordRecovery(email: string): Promise<RecoveryRequestResult> {
  try {
    const normalizedEmail = normalizeRecoveryEmail(email);
    const supabase = await createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(normalizedEmail);
    if (!error || error.code === "user_not_found") return { error: null };
    return { error: errorReason(error, "Password recovery request") };
  } catch (error) {
    return { error: errorReason(error, "Password recovery request") };
  }
}

// Exchanges the emailed code for a recovery session. Google-only accounts are
// signed straight back out, so the browser never keeps their session.
export async function verifyPasswordRecoveryCode(
  email: string,
  code: string,
): Promise<RecoveryVerifyResult> {
  let normalizedEmail: string;
  try {
    normalizedEmail = normalizeRecoveryEmail(email);
  } catch (error) {
    return { error: errorReason(error, "Password recovery verification") };
  }
  const token = code.trim();
  if (!isRecoveryCodeFormat(token)) return { error: "invalid_or_expired_code" };

  const supabase = await createClient();
  const cookieStore = await cookies();
  // Marked before verifying, so a session can never exist without the marker.
  cookieStore.set(
    RECOVERY_MARKER_COOKIE,
    createRecoveryMarkerValue(Date.now()),
    RECOVERY_MARKER_COOKIE_OPTIONS,
  );

  try {
    const { data, error } = await supabase.auth.verifyOtp({
      email: normalizedEmail,
      token,
      type: "recovery",
    });
    if (error || !data.user || !data.session) {
      await expireCookie(RECOVERY_MARKER_COOKIE);
      return { error: errorReason(error, "Password recovery verification") };
    }

    if (!hasEmailPasswordIdentity(data.user)) {
      await endPasswordRecovery(supabase, "local");
      return { status: "google_only" };
    }
    return { status: "ready" };
  } catch (error) {
    await endPasswordRecovery(supabase, "local");
    return { error: errorReason(error, "Password recovery verification") };
  }
}

// Requires the session and marker created by verifyPasswordRecoveryCode. On
// success every session ends and the browser lands on the signed-out success page.
export async function updateRecoveredPassword(
  password: string,
): Promise<{ error: PasswordErrorReason }> {
  const supabase = await createClient();
  const cookieStore = await cookies();
  const marker = readRecoveryMarker(cookieStore.get(RECOVERY_MARKER_COOKIE)?.value, Date.now());
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (marker !== "active" || !user) {
    await endPasswordRecovery(supabase, "local");
    return { error: "session_expired" };
  }
  if (typeof password !== "string" || password.length === 0) {
    return { error: "weak_password" };
  }

  const { error } = await supabase.auth.updateUser({ password });
  if (error) {
    const reason = errorReason(error, "Password recovery update");
    if (reason === "session_expired") await endPasswordRecovery(supabase, "local");
    return { error: reason };
  }

  // A reset may follow a compromise, so end the account's other sessions too.
  await endPasswordRecovery(supabase, "global");
  redirect(RECOVERY_UPDATED_PATH);
}

// Leaving the reset on purpose (Cancel) or after an expired session.
export async function cancelPasswordRecovery(): Promise<void> {
  const supabase = await createClient();
  await endPasswordRecovery(supabase, "local");
}
