"use client";

import { useCallback } from "react";
import { createClient } from "@repo/supabase/browser";
import { useAsyncResource } from "@/hooks/use-async-resource";
import type { ConversationContext } from "@/lib/conversation-context";

const EMPTY_CONTEXT: ConversationContext = { apartment: null, verified: false };

/** Read-only, caller-authorized context for the selected person/property pair. */
export function useConversationContext(
  contactId: string | null,
  apartmentId: string | null,
  portal: "tenant" | "landlord",
  currentUserId: string,
) {
  const load = useCallback(async (): Promise<ConversationContext> => {
    if (!contactId) return EMPTY_CONTEXT;
    const supabase = createClient();
    const apartmentQuery = apartmentId
      ? supabase.from("apartments")
          .select("id, name, barangay, city, monthly_rent, apartment_images(url, url_thumb, is_cover)")
          .eq("id", apartmentId)
          .eq("landlord_id", portal === "landlord" ? currentUserId : contactId)
          .is("deleted_at", null)
      : null;
    // Match the consumer detail route's visibility rules. Owners use their
    // existing property-management route, which also supports hidden listings.
    if (portal === "tenant") apartmentQuery?.eq("is_hidden_by_admin", false);
    const [property, account] = await Promise.all([
      apartmentQuery?.maybeSingle() ?? Promise.resolve({ data: null, error: null }),
      supabase.from("users").select("account_status").eq("id", contactId).maybeSingle(),
    ]);
    if (property.error) console.error("[messages] Apartment context unavailable:", property.error.code);
    if (account.error) console.error("[messages] Account context unavailable:", account.error.code);
    return {
      apartment: property.error ? null : property.data,
      verified: !account.error && account.data?.account_status === "verified",
    };
  }, [contactId, apartmentId, portal, currentUserId]);
  const { data, loading, error } = useAsyncResource(load, EMPTY_CONTEXT, "Unable to load conversation context");
  // useAsyncResource retains the previous result during loading/errors. It must
  // never flash another contact's badge or another apartment's details.
  return { context: loading || error ? EMPTY_CONTEXT : data, loading };
}
