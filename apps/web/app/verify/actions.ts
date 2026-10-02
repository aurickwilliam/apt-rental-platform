"use server";

import { createHash, randomBytes } from "node:crypto";

import { createClient } from "@repo/supabase/server";
import { SECONDARY_IDS, VALID_IDS } from "@repo/constants";

// QR verification sessions: desktop creates, phone claims (read-only) and
// submits (atomic consume + insert). The raw token is returned to its owner
// exactly once at creation; only its SHA-256 digest is persisted. The
// authenticated user always comes from the server session -- client-provided
// user IDs are never trusted, and users can never mark themselves verified
// (account_status is trigger-owned by the user_verifications review flow).

const SESSION_TTL_MINUTES = 10;
const TOKEN_BYTES = 32;
const TOKEN_SHAPE = /^[A-Za-z0-9_-]{43}$/;
const VERIFICATION_BUCKET = "user-verification";

const FRONT_FILE = "id-front.jpg";
const BACK_FILE = "id-back.jpg";
const SELFIE_FILE = "selfie.jpg";
const PASSPORT_LABEL = "Passport";

export type SessionResult =
  | { ok: true; token: string; expiresAt: string }
  | { ok: false; error: string };

export type ClaimResult =
  | { ok: true; userId: string; verificationId: string; expiresAt: string }
  | { ok: false; error: string };

export type SessionStatusResult =
  | { ok: true; status: "active" | "completed" | "expired"; expiresAt: string }
  | { ok: false; error: string };

export type SubmitResult =
  | { ok: true }
  | { ok: false; error: string; needsNewCode?: boolean };

function hashToken(token: string): string {
  return createHash("sha256").update(token, "utf8").digest("hex");
}

function newToken(): string {
  return randomBytes(TOKEN_BYTES).toString("base64url");
}

async function getCaller() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { supabase, profile: null };

  const { data: profile } = await supabase
    .from("users")
    .select("id, account_status")
    .eq("user_id", user.id)
    .maybeSingle();

  return { supabase, profile: profile ?? null };
}

async function hasPendingVerification(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
): Promise<boolean> {
  const { data } = await supabase
    .from("user_verifications")
    .select("id")
    .eq("user_id", userId)
    .eq("status", "pending")
    .limit(1);
  return (data?.length ?? 0) > 0;
}

// Desktop: create a fresh 10-minute session, retiring any live ones first.
// The raw token is returned once and never stored.
export async function createVerificationSession(): Promise<SessionResult> {
  const { supabase, profile } = await getCaller();
  if (!profile) return { ok: false, error: "Please sign in to verify your account." };

  if (profile.account_status === "verified") {
    return { ok: false, error: "Your account is already verified." };
  }
  if (await hasPendingVerification(supabase, profile.id)) {
    return { ok: false, error: "You already have a verification pending review." };
  }

  // Retire stale rows (frees the one-active-session slot) and any live row
  // being replaced by this regeneration.
  await supabase.rpc("expire_own_verification_sessions", { p_include_active: true });

  const token = newToken();
  const expiresAt = new Date(Date.now() + SESSION_TTL_MINUTES * 60 * 1000).toISOString();

  const { data, error } = await supabase
    .from("verification_sessions")
    .insert({
      user_id: profile.id,
      token_hash: hashToken(token),
      expires_at: expiresAt,
    })
    .select("expires_at")
    .single();

  if (error || !data) {
    return {
      ok: false,
      error: "Couldn't create a verification code. Please try again.",
    };
  }

  return { ok: true, token, expiresAt: data.expires_at };
}

// Phone: validate the token and bind it to the signed-in owner WITHOUT
// consuming it. The session stays active while the wizard runs; abandoning
// the page simply lets it expire.
export async function claimVerificationSession(token: string): Promise<ClaimResult> {
  if (!TOKEN_SHAPE.test(token)) {
    return { ok: false, error: "This verification link is invalid." };
  }

  const { supabase, profile } = await getCaller();
  if (!profile) return { ok: false, error: "Please sign in to continue verification." };

  const { data: session } = await supabase
    .from("verification_sessions")
    .select("verification_id, status, expires_at")
    .eq("user_id", profile.id)
    .eq("token_hash", hashToken(token))
    .maybeSingle();

  if (!session) {
    return { ok: false, error: "This verification link is invalid or belongs to another account." };
  }
  if (session.status !== "active") {
    return { ok: false, error: "This code has already been used. Please scan a new code." };
  }
  if (new Date(session.expires_at).getTime() <= Date.now()) {
    return { ok: false, error: "This code has expired. Please scan a new code." };
  }

  return {
    ok: true,
    userId: profile.id,
    verificationId: session.verification_id,
    expiresAt: session.expires_at,
  };
}

// Desktop polling: report live status without exposing document data.
export async function getVerificationSessionStatus(token: string): Promise<SessionStatusResult> {
  if (!TOKEN_SHAPE.test(token)) {
    return { ok: false, error: "This verification link is invalid." };
  }

  const { supabase, profile } = await getCaller();
  if (!profile) return { ok: false, error: "Please sign in." };

  const { data: session } = await supabase
    .from("verification_sessions")
    .select("status, expires_at")
    .eq("user_id", profile.id)
    .eq("token_hash", hashToken(token))
    .maybeSingle();

  if (!session) return { ok: false, error: "Session not found." };
  if (session.status === "completed") {
    return { ok: true, status: "completed", expiresAt: session.expires_at };
  }
  if (new Date(session.expires_at).getTime() <= Date.now()) {
    return { ok: true, status: "expired", expiresAt: session.expires_at };
  }
  return { ok: true, status: "active", expiresAt: session.expires_at };
}

export type VerificationSubmission = {
  idType: string;
};

// Phone: final submit. Uploads already happened client-side straight into the
// private bucket (owner-prefix RLS). This action re-validates the session,
// atomically consumes it (single-use), confirms the three files exist under
// the session's own folder, then inserts the pending row -- whose trigger
// flips account_status to pending. Ordering is consume-then-insert so a
// replayed token can never create a second row.
export async function submitVerificationSession(
  token: string,
  submission: VerificationSubmission,
): Promise<SubmitResult> {
  if (!TOKEN_SHAPE.test(token)) {
    return { ok: false, error: "This verification link is invalid." };
  }

  const allowedTypes = [...VALID_IDS, ...SECONDARY_IDS];
  if (!allowedTypes.includes(submission.idType)) {
    return { ok: false, error: "Please choose a valid ID type." };
  }
  const needsBack = submission.idType !== PASSPORT_LABEL;

  const { supabase, profile } = await getCaller();
  if (!profile) return { ok: false, error: "Please sign in to submit verification." };

  if (profile.account_status === "verified") {
    return { ok: false, error: "Your account is already verified." };
  }

  // Re-validate the live session and learn its folder before consuming.
  const { data: session } = await supabase
    .from("verification_sessions")
    .select("verification_id, status, expires_at")
    .eq("user_id", profile.id)
    .eq("token_hash", hashToken(token))
    .maybeSingle();

  if (!session || session.status !== "active") {
    return {
      ok: false,
      error: "This code has already been used. Please scan a new code.",
      needsNewCode: true,
    };
  }
  if (new Date(session.expires_at).getTime() <= Date.now()) {
    return {
      ok: false,
      error: "This code has expired. Please scan a new code.",
      needsNewCode: true,
    };
  }

  // Confirm the captures actually landed in this session's private folder.
  // Paths are server-constructed, never taken from the client.
  const prefix = `${profile.id}/${session.verification_id}`;
  const frontPath = `${prefix}/${FRONT_FILE}`;
  const backPath = needsBack ? `${prefix}/${BACK_FILE}` : null;
  const selfiePath = `${prefix}/${SELFIE_FILE}`;

  const { data: objects, error: listError } = await supabase.storage
    .from(VERIFICATION_BUCKET)
    .list(prefix);

  if (listError || !objects) {
    return { ok: false, error: "Couldn't confirm your uploads. Please try again." };
  }
  const names = new Set(objects.map((o) => o.name));
  const missing =
    !names.has(FRONT_FILE) ||
    !names.has(SELFIE_FILE) ||
    (needsBack && !names.has(BACK_FILE));
  if (missing) {
    return {
      ok: false,
      error: "Some images are missing. Please recapture and submit again.",
    };
  }

  // Atomic single-use consume. A replayed or raced token affects zero rows.
  const { error: consumeError } = await supabase.rpc("consume_verification_session", {
    p_token_hash: hashToken(token),
  });
  if (consumeError) {
    return {
      ok: false,
      error: "This code has already been used. Please scan a new code.",
      needsNewCode: true,
    };
  }

  const { error: insertError } = await supabase.from("user_verifications").insert({
    id: session.verification_id,
    user_id: profile.id,
    id_type: submission.idType,
    id_front_path: frontPath,
    id_back_path: backPath,
    selfie_path: selfiePath,
  });

  if (insertError) {
    // Session is spent by design; surface the real cause. A duplicate-pending
    // conflict means the account is already queued for review.
    const alreadyPending =
      insertError.code === "23505" ||
      /pending|duplicate/i.test(insertError.message);
    return {
      ok: false,
      error: alreadyPending
        ? "You already have a verification pending review."
        : "Couldn't save your submission. Please generate a new code and try again.",
      needsNewCode: !alreadyPending,
    };
  }

  return { ok: true };
}

// Current account verification state for the desktop page shell.
export async function getVerificationPageState(): Promise<{
  signedIn: boolean;
  accountStatus: string | null;
  hasPending: boolean;
}> {
  const { supabase, profile } = await getCaller();
  if (!profile) return { signedIn: false, accountStatus: null, hasPending: false };

  const pending = await hasPendingVerification(supabase, profile.id);
  return { signedIn: true, accountStatus: profile.account_status, hasPending: pending };
}
