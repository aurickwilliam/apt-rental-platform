import { supabase } from "@repo/supabase";
import { hasEmailPasswordIdentity } from "@repo/utils";

import { SERVER_AUTH_BASE_URL } from "@/constants/serverAuth";

// Password sign-in and one-time-code checks for the app, through the web server
// (app/api/auth/mobile/* on the web app). The phone cannot write the database
// attempt counters, so the server counts every attempt, a lock is shared with the
// website, and reinstalling the app cannot reset it. A success returns the session
// tokens, which `adoptSession` hands to the Supabase client with `setSession`.
//
// Results are Supabase-shaped (`{ data, error }`, `error.code` / `error.message`
// passed through from Auth) so the screens' existing branches keep working. A lock
// adds `retryAfterSeconds`. With no server configured (local development) the
// calls go straight to Supabase, uncounted; a network failure to the server is an
// ordinary "can't connect" error and never falls back silently.

type SetSessionResult = Awaited<ReturnType<typeof supabase.auth.setSession>>;
export type ServerAuthUser = NonNullable<SetSessionResult["data"]["user"]>;

export interface ServerAuthError {
  code?: string;
  message: string;
  /** Set while the attempt limit is reached: seconds until the lock ends. */
  retryAfterSeconds?: number;
}

export type ServerSignInResult =
  | { data: { user: ServerAuthUser }; error: null }
  | { data: { user: null }; error: ServerAuthError };

export type VerifyCodeFlow = "signup" | "recovery";
export type VerifyCodeStatus = "ready" | "google_only";

export type ServerVerifyResult =
  | { data: { user: ServerAuthUser | null; status: VerifyCodeStatus }; error: null }
  | { data: { user: null; status: null }; error: ServerAuthError };

const REQUEST_TIMEOUT_MS = 20_000;
const NETWORK_MESSAGE = "Can't connect right now. Check your connection and try again.";
const GENERIC_MESSAGE = "Something went wrong. Please try again.";

interface ServerSession {
  access_token: string;
  refresh_token: string;
}

interface ServerReply {
  ok: boolean;
  status?: string;
  session?: ServerSession;
  error?: { code?: string; message?: string };
  retryAfterSeconds?: number;
}

type Reply = { ok: true; body: ServerReply } | { ok: false; error: ServerAuthError };

let warnedUnconfigured = false;

function warnIfUnconfigured() {
  // In production this means the build is missing EXPO_PUBLIC_WEB_URL and nothing
  // is counted on the server. No account data in the message.
  if (!__DEV__ && !warnedUnconfigured) {
    warnedUnconfigured = true;
    console.warn("Server auth is not configured (EXPO_PUBLIC_WEB_URL): signing in directly.");
  }
}

function isSession(value: unknown): value is ServerSession {
  if (!value || typeof value !== "object") return false;
  const { access_token, refresh_token } = value as Partial<ServerSession>;
  return typeof access_token === "string" && typeof refresh_token === "string";
}

async function readReply(response: Response): Promise<ServerReply | null> {
  try {
    const body: unknown = await response.json();
    if (!body || typeof body !== "object" || typeof (body as ServerReply).ok !== "boolean") return null;
    const reply = body as ServerReply;
    return { ...reply, session: isSession(reply.session) ? reply.session : undefined };
  } catch {
    return null;
  }
}

async function postJson(path: string, payload: unknown): Promise<Reply> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const response = await fetch(`${SERVER_AUTH_BASE_URL}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    const body = await readReply(response);
    if (!body) return { ok: false, error: { code: "unexpected_failure", message: GENERIC_MESSAGE } };
    if (body.ok) return { ok: true, body };
    return {
      ok: false,
      error: {
        code: body.error?.code,
        message: body.error?.message ?? GENERIC_MESSAGE,
        retryAfterSeconds:
          typeof body.retryAfterSeconds === "number" && body.retryAfterSeconds > 0
            ? body.retryAfterSeconds
            : undefined,
      },
    };
  } catch {
    // Never log the request: it carries the password or the code.
    return { ok: false, error: { code: "network_error", message: NETWORK_MESSAGE } };
  } finally {
    clearTimeout(timer);
  }
}

async function adoptSession(session: ServerSession | undefined): Promise<ServerSignInResult> {
  if (!session) return { data: { user: null }, error: { code: "unexpected_failure", message: GENERIC_MESSAGE } };
  const { data, error } = await supabase.auth.setSession(session);
  if (error || !data.user) {
    return { data: { user: null }, error: { code: error?.code, message: error?.message ?? GENERIC_MESSAGE } };
  }
  return { data: { user: data.user }, error: null };
}

export interface SignInInput {
  email: string;
  password: string;
  captchaToken?: string;
}

export async function signInViaServer({ email, password, captchaToken }: SignInInput): Promise<ServerSignInResult> {
  if (!SERVER_AUTH_BASE_URL) {
    warnIfUnconfigured();
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
      options: captchaToken ? { captchaToken } : undefined,
    });
    if (error || !data.user) {
      return { data: { user: null }, error: { code: error?.code, message: error?.message ?? GENERIC_MESSAGE } };
    }
    return { data: { user: data.user }, error: null };
  }

  const reply = await postJson("/api/auth/mobile/sign-in", { email, password, captchaToken });
  if (!reply.ok) return { data: { user: null }, error: reply.error };
  return adoptSession(reply.body.session);
}

export interface VerifyCodeInput {
  email: string;
  code: string;
  flow: VerifyCodeFlow;
}

export async function verifyCodeViaServer({ email, code, flow }: VerifyCodeInput): Promise<ServerVerifyResult> {
  if (!SERVER_AUTH_BASE_URL) {
    warnIfUnconfigured();
    const { data, error } = await supabase.auth.verifyOtp({ email, token: code, type: flow });
    // A password reset must end with a session; a sign-up code only needs the user.
    if (error || !data.user || (flow === "recovery" && !data.session)) {
      return { data: { user: null, status: null }, error: { code: error?.code, message: error?.message ?? GENERIC_MESSAGE } };
    }
    // Direct: the session is already saved, so a Google-only reset is ended by the caller.
    const googleOnly = flow === "recovery" && !hasEmailPasswordIdentity(data.user);
    return { data: { user: data.user, status: googleOnly ? "google_only" : "ready" }, error: null };
  }

  const reply = await postJson("/api/auth/mobile/verify-code", { email, code, flow });
  if (!reply.ok) return { data: { user: null, status: null }, error: reply.error };
  // A Google-only account finishing a reset comes back with no tokens at all.
  if (reply.body.status === "google_only") return { data: { user: null, status: "google_only" }, error: null };

  const adopted = await adoptSession(reply.body.session);
  if (adopted.error) return { data: { user: null, status: null }, error: adopted.error };
  return { data: { user: adopted.data.user, status: "ready" }, error: null };
}
