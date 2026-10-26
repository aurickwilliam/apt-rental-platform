import { supabase } from "@repo/supabase";
import { translate, type LanguageCode } from "@repo/i18n";

/** English title kept for callers that have no language in scope. */
export const SUSPENDED_TITLE = translate("en", "authMobile.suspended.title");
/** English message kept for callers that have no language in scope. */
export const SUSPENDED_MESSAGE = translate("en", "authMobile.suspended.message");

export function suspendedTitle(language: LanguageCode = "en"): string {
  return translate(language, "authMobile.suspended.title");
}

export function buildSuspendedMessage(
  reason?: string | null,
  language: LanguageCode = "en",
): string {
  const trimmed = reason?.trim();
  if (!trimmed) return translate(language, "authMobile.suspended.message");
  return translate(language, "authMobile.suspended.messageWithReason", {
    reason: trimmed,
  });
}

// OAuth redirects carry failures as error params in the query or the hash.
export function getOAuthRedirectError(url: string): { code: string | null; description: string | null } {
  const parsed = new URL(url);
  const hashParams = new URLSearchParams(parsed.hash.replace(/^#/, ""));
  const read = (key: string) => parsed.searchParams.get(key) ?? hashParams.get(key);
  return { code: read("error_code"), description: read("error_description") };
}

// Suspension lives in public.users (not Auth), so a suspended user can sign in
// and read their own state. The RPC returns only the caller's own status.
export async function getMySuspensionStatus(): Promise<{ suspended: boolean; reason: string | null }> {
  const { data, error } = await supabase.rpc("get_my_suspension_status");
  if (error || !data || typeof data !== "object" || Array.isArray(data)) {
    return { suspended: false, reason: null };
  }
  const status = data as { suspended?: boolean; reason?: string | null };
  return { suspended: status.suspended === true, reason: status.reason ?? null };
}
