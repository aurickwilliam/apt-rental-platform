"use server";

import { redirect } from "next/navigation";
import { cookies, headers } from "next/headers";
import { createClient } from "@repo/supabase/server";
import { RECOVERY_MARKER_COOKIE } from "@repo/supabase/password-recovery";
import { PORTAL_COOKIE, preferredPortal } from "@/lib/portal-preference";
import {
  clearSignInFailures,
  clientIpFromHeaders,
  isSignInBlocked,
  pruneSignInBuckets,
  recordSignInFailure,
  signInEmailKey,
  signInIpKey,
  type SignInBuckets,
  SIGN_IN_THROTTLE_MESSAGE,
} from "@/lib/sign-in-rate-limit";

export interface SignInFormState {
  error: string | null;
  // The password was right but the email code was never entered: the form
  // offers to send a new code and confirm it.
  needsEmailConfirmation?: boolean;
}

interface UserRolesProfile { roles: string[] }

// Brute-force protection state: one in-memory failure-window store shared by
// every sign-in request in this process. Next keeps one server process here,
// and Supabase Auth keeps its own platform limits as the backstop; a
// multi-instance deployment would need a shared store (documented limit).
const signInBuckets: SignInBuckets = new Map();

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

  // Brute-force guard: refuse with a generic message (no Supabase call, no
  // account enumeration) while either the email or the client-IP failure
  // window is spent. "Invalid login credentials" is the only failure that
  // counts — other errors and successes never deepen a window.
  const requestHeaders = await headers();
  const clientIp = clientIpFromHeaders({
    "x-forwarded-for": requestHeaders.get("x-forwarded-for"),
    "x-real-ip": requestHeaders.get("x-real-ip"),
  });
  const attemptKeys = [signInEmailKey(email)];
  if (clientIp) attemptKeys.push(signInIpKey(clientIp));
  const now = Date.now();
  pruneSignInBuckets(signInBuckets, now);
  if (attemptKeys.some((key) => isSignInBlocked(signInBuckets, key, now).blocked)) {
    return { error: SIGN_IN_THROTTLE_MESSAGE };
  }

  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    // Map common Supabase auth errors to user-friendly messages
    if (error.message === "Invalid login credentials") {
      for (const key of attemptKeys) recordSignInFailure(signInBuckets, key, Date.now());
      return { error: "Invalid email or password. Please try again." };
    }
    if (error.message === "Email not confirmed") {
      return {
        error: "Please verify your email address before signing in.",
        needsEmailConfirmation: true,
      };
    }
    if (error.message.includes("rate limit")) {
      return { error: "Too many sign-in attempts. Please try again later." };
    }
    return { error: error.message };
  }

  // A good sign-in resets the email and IP windows, so a shared office IP is
  // not punished for an attacker's earlier guesses.
  for (const key of attemptKeys) clearSignInFailures(signInBuckets, key);

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
