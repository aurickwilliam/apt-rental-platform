import { redirect } from "next/navigation";

import { createClient } from "@repo/supabase/server";

import { buildPortalContacts, getContactConversationKey } from "@/lib/conversation-contacts";

import { Contact } from "./components/types";
import MessagesClient from "./components/MessageClient";

export default async function MessagesPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: landlord } = await supabase
    .from("users")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!landlord) redirect("/login");

  const landlordId = landlord.id;

  const resolveAvatar = (avatarUrl: string | null, userId: string) =>
    avatarUrl ?? `https://i.pravatar.cc/150?u=${userId}`;

  const [{ data: tenancyRows, error: tenancyError }, { data: conversationRows, error: conversationError }] =
    await Promise.all([
      supabase
        .from("tenancies")
        .select(`
          tenant:users!tenancies_tenant_id_fkey (
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
        .eq("landlord_id", landlordId)
        .eq("status", "active"),
      // Landlord-side conversations only: chats about other people's apartments
      // belong to the tenant portal.
      supabase.rpc("get_portal_conversations", { p_portal: "landlord" }),
    ]);

  if (tenancyError) console.error("[landlord messages] Failed to load tenancies:", tenancyError);
  if (conversationError) {
    console.error("[landlord messages] Failed to load conversations:", conversationError);
  }

  // Current Tenants: active tenancies under this landlord, shown even before any message
  const activeTenants: Contact[] = (tenancyRows ?? []).map((row) => {
    const tenant = row.tenant as { id: string; first_name: string; last_name: string; avatar_url: string | null };
    const apartment = row.apartment as { id: string; name: string };
    return {
      id: tenant.id,
      conversationKey: getContactConversationKey(tenant.id, apartment?.id ?? null),
      name: `${tenant.first_name} ${tenant.last_name}`.trim(),
      avatar: resolveAvatar(tenant.avatar_url, tenant.id),
      apartment: apartment.name,
      apartmentId: apartment?.id ?? null,
      unreadCount: 0,
    };
  });

  // Inquiries: every other landlord-side conversation, newest first
  const { pinned: currentTenants, others: inquiries } = buildPortalContacts({
    rows: conversationRows ?? [],
    pinned: activeTenants,
    describeApartment: (apartmentName) =>
      apartmentName ? `Inquiring: ${apartmentName}` : "Inquiring",
    resolveAvatar,
  });

  return (
    <MessagesClient
      currentTenants={currentTenants}
      inquiries={inquiries}
      currentUserId={landlordId}
    />
  );
}