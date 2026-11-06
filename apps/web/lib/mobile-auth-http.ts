import { AUTH_THROTTLE_MESSAGE, isAuthRateLimitError } from "@repo/utils";
import {
  isInvalidCredentialsError,
  type AttemptError,
  type AuthSessionLike,
  type CodeAttempt,
  type SignInAttempt,
} from "@/lib/auth-attempts";

// Request parsing and responses for the mobile auth routes
// (app/api/auth/mobile/*). Pure, so it can be tested without a server.
//
// The routes take a password or a one-time code, so they stay strict: POST only,
// a small JSON body with length caps, `Cache-Control: no-store`, no CORS headers
// (a native app needs none, and a browser page must not call them), and nothing
// from the body (email, password, code, tokens) is ever logged.

export const MAX_BODY_BYTES = 8192;
export const MAX_EMAIL_LENGTH = 254;
export const MAX_PASSWORD_LENGTH = 256;
// A Turnstile token can be up to 2,048 characters.
export const MAX_CAPTCHA_TOKEN_LENGTH = 4096;
export const MAX_CODE_LENGTH = 16;

export type VerifyCodeFlow = "signup" | "recovery";

export interface SignInBody {
  email: string;
  password: string;
  captchaToken?: string;
}

export interface VerifyCodeBody {
  email: string;
  code: string;
  flow: VerifyCodeFlow;
}

type JsonObject = Record<string, unknown>;

/** The request body as a JSON object, or null when it is missing, too big or not an object. */
export async function readJsonObject(request: Request): Promise<JsonObject | null> {
  const declared = Number(request.headers.get("content-length"));
  if (Number.isFinite(declared) && declared > MAX_BODY_BYTES) return null;

  let text: string;
  try {
    text = await request.text();
  } catch {
    return null;
  }
  if (text.length > MAX_BODY_BYTES) return null;

  try {
    const value: unknown = JSON.parse(text);
    return value && typeof value === "object" && !Array.isArray(value) ? (value as JsonObject) : null;
  } catch {
    return null;
  }
}

function boundedString(value: unknown, max: number): string | null {
  return typeof value === "string" && value.length > 0 && value.length <= max ? value : null;
}

export function parseSignInBody(body: JsonObject | null): SignInBody | null {
  if (!body) return null;
  const email = boundedString(body.email, MAX_EMAIL_LENGTH);
  const password = boundedString(body.password, MAX_PASSWORD_LENGTH);
  if (!email || !password) return null;
  if (body.captchaToken === undefined || body.captchaToken === null) return { email, password };
  const captchaToken = boundedString(body.captchaToken, MAX_CAPTCHA_TOKEN_LENGTH);
  return captchaToken ? { email, password, captchaToken } : null;
}

export function parseVerifyCodeBody(body: JsonObject | null): VerifyCodeBody | null {
  if (!body) return null;
  const email = boundedString(body.email, MAX_EMAIL_LENGTH);
  const code = boundedString(body.code, MAX_CODE_LENGTH);
  if (!email || !code) return null;
  if (body.flow !== "signup" && body.flow !== "recovery") return null;
  return { email, code, flow: body.flow };
}

export function jsonResponse(body: unknown, status = 200, headers: Record<string, string> = {}): Response {
  return Response.json(body, { status, headers: { "Cache-Control": "no-store", ...headers } });
}

export function invalidRequestResponse(): Response {
  return jsonResponse({ ok: false, error: { code: "invalid_request", message: "Invalid request." } }, 400);
}

export function unavailableResponse(): Response {
  return jsonResponse(
    { ok: false, error: { code: "service_unavailable", message: "Sign in is unavailable right now." } },
    503,
  );
}

export function unexpectedResponse(): Response {
  return jsonResponse(
    { ok: false, error: { code: "unexpected_failure", message: "Something went wrong. Please try again." } },
    500,
  );
}

function lockedResponse(retryAfterSeconds: number): Response {
  return jsonResponse(
    {
      ok: false,
      error: { code: "auth_locked", message: AUTH_THROTTLE_MESSAGE },
      retryAfterSeconds,
    },
    429,
    { "Retry-After": String(retryAfterSeconds) },
  );
}

function statusForError(error: AttemptError): number {
  if (isInvalidCredentialsError(error)) return 401;
  if (isAuthRateLimitError(error)) return 429;
  return 400;
}

// The Supabase error is passed through (code and message), exactly what a client
// talking to Auth directly would see, so the app's existing branches keep working.
function errorResponse(error: AttemptError): Response {
  return jsonResponse(
    { ok: false, error: { code: error.code, message: error.message } },
    statusForError(error),
  );
}

function sessionPayload(session: AuthSessionLike | null) {
  return session ? { access_token: session.access_token, refresh_token: session.refresh_token } : null;
}

export function signInResponse(attempt: SignInAttempt): Response {
  if (attempt.ok) {
    const session = sessionPayload(attempt.session);
    return session ? jsonResponse({ ok: true, session }) : unexpectedResponse();
  }
  return attempt.kind === "locked" ? lockedResponse(attempt.retryAfterSeconds) : errorResponse(attempt.error);
}

export function codeResponse(attempt: CodeAttempt): Response {
  if (attempt.ok) {
    const session = sessionPayload(attempt.session);
    return session ? jsonResponse({ ok: true, status: "ready", session }) : unexpectedResponse();
  }
  if (attempt.kind === "locked") return lockedResponse(attempt.retryAfterSeconds);
  if (attempt.kind === "invalid_code") {
    // Same code and wording a direct verifyOtp gives, which the app already maps.
    return jsonResponse(
      { ok: false, error: { code: "otp_expired", message: "Token has expired or is invalid" } },
      401,
    );
  }
  return errorResponse(attempt.error);
}

/** Google-only accounts finish a recovery with no session at all. */
export function googleOnlyResponse(): Response {
  return jsonResponse({ ok: true, status: "google_only" });
}
