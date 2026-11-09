import { attemptSignIn } from "@/lib/auth-attempts";
import { getAuthThrottleClient } from "@/lib/auth-throttle-server";
import {
  invalidRequestResponse,
  parseSignInBody,
  readJsonObject,
  signInResponse,
  unavailableResponse,
  unexpectedResponse,
} from "@/lib/mobile-auth-http";
import { createStatelessAuthClient } from "@/lib/mobile-auth-server";
import { clientIpFromHeaders } from "@/lib/sign-in-rate-limit";

// Password sign-in for the mobile app. The phone cannot write the database
// attempt counters (service role only), so it signs in through here: the same
// windows as the website count the attempt, a lock is shared between web and
// mobile, and reinstalling the app cannot reset it. A success returns the session
// tokens, which the app adopts with `supabase.auth.setSession`. See
// `lib/auth-attempts.ts` and `lib/mobile-auth-http.ts`.
export async function POST(request: Request) {
  try {
    const body = parseSignInBody(await readJsonObject(request));
    if (!body) return invalidRequestResponse();

    const client = createStatelessAuthClient();
    if (!client) return unavailableResponse();

    const attempt = await attemptSignIn({
      auth: client.auth,
      throttle: getAuthThrottleClient(),
      email: body.email,
      password: body.password,
      captchaToken: body.captchaToken,
      clientIp: clientIpFromHeaders({
        "x-vercel-forwarded-for": request.headers.get("x-vercel-forwarded-for"),
        "x-real-ip": request.headers.get("x-real-ip"),
        "x-forwarded-for": request.headers.get("x-forwarded-for"),
      }),
    });
    return signInResponse(attempt);
  } catch {
    // The type only: a message could echo the email or the password.
    console.error("Mobile sign-in route failed unexpectedly.");
    return unexpectedResponse();
  }
}
