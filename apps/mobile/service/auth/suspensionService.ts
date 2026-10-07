import { supabase } from "@repo/supabase";

export const SUSPENDED_TITLE = "Account suspended";
export const SUSPENDED_MESSAGE =
  "Your account has been suspended. Contact support if you think this is a mistake.";

interface SuspensionNotice {
  suspended: boolean;
  reason?: string | null;
}

export function isBannedAuthError(error: { code?: string; message?: string } | null): boolean {
  if (!error) return false;
  return error.code === "user_banned" || /banned/i.test(error.message ?? "");
}

export function buildSuspendedMessage(reason?: string | null): string {
  const trimmed = reason?.trim();
  if (!trimmed) return SUSPENDED_MESSAGE;
  return `Your account has been suspended.\n\nReason: ${trimmed}\n\nContact support if you think this is a mistake.`;
}

// The reason is only returned after the server re-checks the password, so a
// failed lookup falls back to the generic message.
export async function getSuspensionReason(email: string, password: string): Promise<string | null> {
  const { data, error } = await supabase.functions.invoke<SuspensionNotice>("suspension-notice", {
    body: { email, password },
  });
  if (error || !data?.suspended) return null;
  return data.reason ?? null;
}

// OAuth redirects carry failures as error params in the query or the hash.
export function getOAuthRedirectError(url: string): { code: string | null; description: string | null } {
  const parsed = new URL(url);
  const hashParams = new URLSearchParams(parsed.hash.replace(/^#/, ""));
  const read = (key: string) => parsed.searchParams.get(key) ?? hashParams.get(key);
  return { code: read("error_code"), description: read("error_description") };
}

// For a device that is still signed in when the account gets suspended. The
// RPC returns only the caller's own state, so no password re-check is needed.
export async function getMySuspensionStatus(): Promise<{ suspended: boolean; reason: string | null }> {
  const { data, error } = await supabase.rpc("get_my_suspension_status");
  if (error || !data || typeof data !== "object" || Array.isArray(data)) {
    return { suspended: false, reason: null };
  }
  const status = data as { suspended?: boolean; reason?: string | null };
  return { suspended: status.suspended === true, reason: status.reason ?? null };
}
