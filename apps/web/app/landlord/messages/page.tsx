import { Suspense } from "react";
import { redirect } from "next/navigation";

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

  // Notification deep link: the web conversation key. Repeated values and
  // unknown keys simply fall back to the portal default selection.
  const { conversation } = await searchParams;
  const initialConversationKey = typeof conversation === "string" ? conversation : null;

  // The route commits as soon as identity is authorized; contacts stream
  // behind the same two-pane skeleton used by the route-level loading state.
  return (
    <Suspense fallback={<MessagesRouteSkeleton />}>
      <LandlordMessagesWorkspace
        landlordId={landlordId}
        initialConversationKey={initialConversationKey}
      />
    </Suspense>
  );
}

async function LandlordMessagesWorkspace({
  landlordId,
  initialConversationKey,
}: {
  landlordId: string;
  initialConversationKey: string | null;
}) {
  const supabase = await createClient();

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
      avatar: resolveContactAvatar(tenant.avatar_url),
      apartment: apartment.name,
      apartmentId: apartment?.id ?? null,
      unreadCount: 0,
    };
  });

  // Inquiries: every other landlord-side conversation, newest first
  const { pinned: currentTenants, others: inquiries } = buildPortalContacts({
    rows: conversationRows ?? [],
    currentUserId: landlordId,
    pinned: activeTenants,
    describeApartment: (apartmentName) => apartmentName || "No apartment linked",
  });

  return (
    <MessagesClient
      currentTenants={currentTenants}
      inquiries={inquiries}
      currentUserId={landlordId}
      initialConversationKey={initialConversationKey}
    />
  );
}
