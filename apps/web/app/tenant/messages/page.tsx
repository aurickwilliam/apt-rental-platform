import { Suspense } from "react";
import { requirePortalViewer } from "@/lib/server-identity";

import { createClient } from "@repo/supabase/server";

import MessagesRouteSkeleton from "@/app/components/chat/MessagesRouteSkeleton";
import {
  buildPortalContacts,
  getContactConversationKey,
  resolveContactAvatar,
} from "@/lib/conversation-contacts";

import { Contact } from "./components/types";
import MessagesClient from "./components/MessageClient";

export default async function MessagesPage({
  searchParams,
}: {
  searchParams: Promise<{ conversation?: string | string[] }>;
}) {
  const { profile: tenant } = await requirePortalViewer("tenant");

  const tenantId = tenant.id;

  // Notification deep link: the web conversation key. Repeated values and
  // unknown keys simply fall back to the portal default selection.
  const { conversation } = await searchParams;
  const initialConversationKey = typeof conversation === "string" ? conversation : null;

  // The route commits as soon as identity is authorized. Contacts and their
  // first thread are a separate async unit, so the two-pane skeleton is the
  // only thing waiting on the conversation queries.
  return (
    <Suspense fallback={<MessagesRouteSkeleton />}>
      <TenantMessagesWorkspace
        tenantId={tenantId}
        initialConversationKey={initialConversationKey}
      />
    </Suspense>
  );
}

async function TenantMessagesWorkspace({
  tenantId,
  initialConversationKey,
}: {
  tenantId: string;
  initialConversationKey: string | null;
}) {
  const supabase = await createClient();

  const [{ data: tenancyRows, error: tenancyError }, { data: conversationRows, error: conversationError }] =
    await Promise.all([
      supabase
        .from("tenancies")
        .select(`
          landlord:users!tenancies_landlord_id_fkey (
            id,
            first_name,
            last_name,
            avatar_url
          ),
          apartment:apartments!tenancies_apartment_id_fkey (
            id,
            name
          )
        `)
        .eq("tenant_id", tenantId)
        .eq("status", "active"),
      // Tenant-side conversations only: chats about apartments this user owns
      // belong to the landlord portal.
      supabase.rpc("get_portal_conversations", { p_portal: "tenant" }),
    ]);

  if (tenancyError) console.error("[tenant messages] Failed to load tenancies:", tenancyError);
  if (conversationError) {
    console.error("[tenant messages] Failed to load conversations:", conversationError);
  }

  // My Landlord: active landlord relationship(s), shown even before any message
  const seenConversations = new Set<string>();
  const activeLandlords: Contact[] = (tenancyRows ?? []).reduce<Contact[]>((acc, row) => {
    const landlord = row.landlord as { id: string; first_name: string; last_name: string; avatar_url: string | null } | null;
    const apartment = row.apartment as { id: string; name: string } | null;
    if (!landlord || !apartment?.id) return acc;

    const conversationKey = getContactConversationKey(landlord.id, apartment.id);
    if (seenConversations.has(conversationKey)) return acc;
    seenConversations.add(conversationKey);
    acc.push({
      id: landlord.id,
      conversationKey,
      name: `${landlord.first_name} ${landlord.last_name}`.trim(),
      avatar: resolveContactAvatar(landlord.avatar_url),
      apartment: `Current: ${apartment.name}`,
      apartmentId: apartment.id,
      unreadCount: 0,
    });
    return acc;
  }, []);

  // Past Inquiries: every other tenant-side conversation, newest first
  const { pinned: myLandlord, others: pastInquiries } = buildPortalContacts({
    rows: conversationRows ?? [],
    currentUserId: tenantId,
    pinned: activeLandlords,
    describeApartment: (apartmentName) =>
      apartmentName ? `Previous inquiry: ${apartmentName}` : "Previous inquiry",
  });

  return (
    <div className="flex h-[calc(100dvh-3.5rem)] min-h-0 w-full overflow-hidden bg-card md:h-dvh">
      <MessagesClient
        myLandlord={myLandlord}
        pastInquiries={pastInquiries}
        currentUserId={tenantId}
        initialConversationKey={initialConversationKey}
      />
    </div>
  );
}
