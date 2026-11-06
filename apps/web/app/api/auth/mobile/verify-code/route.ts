import { hasEmailPasswordIdentity } from "@repo/utils";
import { attemptCodeVerification } from "@/lib/auth-attempts";
import { getAuthThrottleClient } from "@/lib/auth-throttle-server";
import {
  codeResponse,
  googleOnlyResponse,
  invalidRequestResponse,
  parseVerifyCodeBody,
  readJsonObject,
  unavailableResponse,
  unexpectedResponse,
} from "@/lib/mobile-auth-http";
import { createStatelessAuthClient } from "@/lib/mobile-auth-server";

// 6-digit email code check for the mobile app (sign-up and confirm-email codes,
// and the password-reset code). Counted on the server with the same windows as
// the website (`signup_otp` / `recovery_otp`), so a lock is shared and cannot be
// reset from the phone. A verified code returns the session tokens, which the app
// adopts with `supabase.auth.setSession`. A Google-only account finishing a reset
// is signed straight back out and gets no tokens, like on the website.
export async function POST(request: Request) {
  try {
    const body = parseVerifyCodeBody(await readJsonObject(request));
    if (!body) return invalidRequestResponse();

    const client = createStatelessAuthClient();
    if (!client) return unavailableResponse();

    const recovery = body.flow === "recovery";
    const attempt = await attemptCodeVerification({
      auth: client.auth,
      throttle: getAuthThrottleClient(),
      purpose: recovery ? "recovery_otp" : "signup_otp",
      otpType: recovery ? "recovery" : "signup",
      email: body.email,
      code: body.code,
    });

    if (recovery && attempt.ok && !hasEmailPasswordIdentity(attempt.user as Parameters<typeof hasEmailPasswordIdentity>[0])) {
      await client.auth.signOut({ scope: "local" });
      return googleOnlyResponse();
    }
    return codeResponse(attempt);
  } catch {
    console.error("Mobile code verification route failed unexpectedly.");
    return unexpectedResponse();
  }
}
