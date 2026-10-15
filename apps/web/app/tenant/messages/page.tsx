import { redirect } from "next/navigation";

import { createClient } from "@repo/supabase/server";

import {
  buildPortalContacts,
  getContactConversationKey,
  resolveContactAvatar,
} from "@/lib/conversation-contacts";

import { Contact } from "./components/types";
import MessagesClient from "./components/MessageClient";

export default async function MessagesPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: tenant } = await supabase
    .from("users")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!tenant) redirect("/login");

  const tenantId = tenant.id;

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
    pinned: activeLandlords,
    describeApartment: (apartmentName) =>
      apartmentName ? `Previous inquiry: ${apartmentName}` : "Previous inquiry",
  });

  return (
    <div className="flex h-[calc(100dvh-5rem)] min-h-0 w-full overflow-hidden bg-card md:h-dvh">
      <MessagesClient
        myLandlord={myLandlord}
        pastInquiries={pastInquiries}
        currentUserId={tenantId}
      />
    </div>
  );
}
  