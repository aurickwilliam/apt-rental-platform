"use server";

import { redirect } from "next/navigation";
import { cookies, headers } from "next/headers";
import { createClient } from "@repo/supabase/server";
import { RECOVERY_MARKER_COOKIE } from "@repo/supabase/password-recovery";
import { PORTAL_COOKIE, preferredPortal } from "@/lib/portal-preference";
import { CAPTCHA_FAILED_MESSAGE, isAuthRateLimitError, isCaptchaError } from "@repo/utils";
import { attemptSignIn, isInvalidCredentialsError } from "@/lib/auth-attempts";
import { getAuthThrottleClient } from "@/lib/auth-throttle-server";
import { clientIpFromHeaders, SIGN_IN_THROTTLE_MESSAGE } from "@/lib/sign-in-rate-limit";

export interface SignInFormState {
  error: string | null;
  // Too many wrong attempts: seconds until the lock ends. The form opens the
  // lockout modal and keeps Sign in disabled for that long.
  lockedForSeconds?: number;
  // The password was right but the email code was never entered: the form
  // offers to send a new code and confirm it.
  needsEmailConfirmation?: boolean;
}

interface UserRolesProfile { roles: string[] }

// Only the verification handoff may resume after login. Re-validated here
// (never trust the client): exact /verify or /verify/mobile?token=<opaque>.
// Session claim/submit still enforce same-account ownership server-side.
function safeVerifyNext(value: unknown): string | null {
  if (typeof value !== "string" || value.length === 0) return null;
  if (value === "/verify") return value;
  if (/^\/verify\/mobile\?token=[A-Za-z0-9_-]{43}$/.test(value)) return value;
  return null;
}

export async function signIn(
  _prevState: SignInFormState,
  formData: FormData
): Promise<SignInFormState> {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const resumeTo = safeVerifyNext(formData.get("next"));

  if (!email || !password) {
    return { error: "Email and password are required." };
  }

  // Brute-force guard (shared with the mobile route, `lib/auth-attempts.ts`):
  // refuses with a generic message (no account enumeration) while any failure
  // window in the database is spent (email from this IP, the email's hourly
  // ceiling, this IP). The counters are written only on the server, with the
  // service role. "Invalid login credentials" is the only failure that counts.
  const requestHeaders = await headers();
  const clientIp = clientIpFromHeaders({
    "x-vercel-forwarded-for": requestHeaders.get("x-vercel-forwarded-for"),
    "x-real-ip": requestHeaders.get("x-real-ip"),
    "x-forwarded-for": requestHeaders.get("x-forwarded-for"),
  });
  const supabase = await createClient();

  // Single-use Turnstile token from the form; Supabase rejects a missing or
  // reused one once CAPTCHA protection is enabled for the project.
  const captchaToken = formData.get("captchaToken");
  const attempt = await attemptSignIn({
    auth: supabase.auth,
    throttle: getAuthThrottleClient(),
    email,
    password,
    captchaToken: typeof captchaToken === "string" && captchaToken ? captchaToken : undefined,
    clientIp,
  });

  if (!attempt.ok) {
    if (attempt.kind === "locked") {
      return { error: SIGN_IN_THROTTLE_MESSAGE, lockedForSeconds: attempt.retryAfterSeconds };
    }
    const { error } = attempt;
    // Not a wrong password, so it never counts toward the throttle.
    if (isCaptchaError(error)) return { error: CAPTCHA_FAILED_MESSAGE };
    // Map common Supabase auth errors to user-friendly messages
    if (isInvalidCredentialsError(error)) {
      return { error: "Invalid email or password. Please try again." };
    }
    if (error.message === "Email not confirmed") {
      return {
        error: "Please verify your email address before signing in.",
        needsEmailConfirmation: true,
      };
    }
    if (isAuthRateLimitError(error)) {
      return { error: "Too many sign-in attempts. Please try again later." };
    }
    return { error: error.message };
  }

  // A fresh sign-in replaces any password-recovery session, so drop its marker
  // (otherwise the middleware would sign this new session out).
  (await cookies()).set(RECOVERY_MARKER_COOKIE, "", { path: "/", maxAge: 0 });

  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    await supabase.auth.signOut();
    return { error: "Could not verify your account. Please try again." };
  }

  // Suspended accounts can authenticate but cannot read their own profile
  // (RLS); keep the session and explain why on /suspended.
  const { data: suspension } = await supabase.rpc("get_my_suspension_status");
  if ((suspension as { suspended?: boolean } | null)?.suspended) {
    redirect("/suspended");
  }

  const { data: profileData, error: profileError } = await supabase
    .from("users")
    .select("roles")
    .eq("user_id", user.id)
    .maybeSingle();
  const profile = profileData as unknown as UserRolesProfile | null;

  if (profile?.roles.includes("admin")) {
    redirect("/admin/dashboard");
  }

  // Confirmed account whose profile was never saved (sign-up interrupted
  // after the email code): keep the session and finish the profile, instead
  // of leaving the account locked out. Suspension was handled above.
  if (!profileError && !profile) {
    redirect("/sign-up?from=profile-missing");
  }

  if (profileError || !profile) {
    console.error("Could not load sign-in profile", profileError);
    await supabase.auth.signOut();
    return { error: "Could not load your profile. Please try again." };
  }

  // Role-agnostic sign-in: no portal is requested here (role tabs live
  // on the sign-up page only). Route by the user's held roles, respecting
  // their last portal choice. Admin is handled above.
  const portal = preferredPortal(
    profile.roles,
    (await cookies()).get(PORTAL_COOKIE)?.value ?? null,
  );
  if (!portal) {
    await supabase.auth.signOut();
    return {
      error: "No account profile was found. Please sign up first.",
    };
  }

  (await cookies()).set(PORTAL_COOKIE, portal, { sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 60 * 60 * 24 * 30 });

  // Phone verification handoff: return to the exact mobile page (with its
  // opaque token) instead of the portal dashboard. Claim/submit still verify
  // same-account ownership, and the session is NOT consumed by signing in.
  if (resumeTo) {
    redirect(resumeTo);
  }

  // Redirect based on resolved portal
  if (portal === "landlord") {
    redirect("/landlord/dashboard");
  } else {
    redirect("/tenant/my-rental");
  }
}
