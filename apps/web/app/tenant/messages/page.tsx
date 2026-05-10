import { redirect } from "next/navigation";

import { createClient } from "@repo/supabase/server";

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

  // Get unread message counts for all conversations involving this tenant
  const { data: unreadRows } = await supabase
    .from("chat")
    .select("sender_id, apartment_id")
    .eq("receiver_id", tenantId)
    .eq("is_read", false);

  const unreadCountByConversation = (unreadRows ?? []).reduce<Map<string, number>>((acc, row) => {
    const senderId = row.sender_id;
    const apartmentId = row.apartment_id ?? "none";
    const key = `${senderId}:${apartmentId}`;
    acc.set(key, (acc.get(key) ?? 0) + 1);
    return acc;
  }, new Map<string, number>());

  const resolveAvatar = (avatarUrl: string | null) => {
    const normalized = avatarUrl?.trim();
    return normalized ? normalized : "";
  };

  const { data: tenancyRows } = await supabase
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
    .eq("status", "active");

  // My Landlord: active landlord relationship(s) for this tenant
  const seenConversations = new Set<string>();
  const myLandlord: Contact[] = (tenancyRows ?? []).reduce<Contact[]>((acc, row) => {
    const landlord = row.landlord as { id: string; first_name: string; last_name: string; avatar_url: string | null } | null;
    const apartment = row.apartment as { id: string; name: string } | null;
    if (!landlord || !apartment?.id) return acc;

    const conversationKey = `${landlord.id}:${apartment.id}`;
    if (seenConversations.has(conversationKey)) return acc;
    seenConversations.add(conversationKey);
    acc.push({
      id: landlord.id,
      conversationKey,
      name: `${landlord.first_name} ${landlord.last_name}`.trim(),
      avatar: resolveAvatar(landlord.avatar_url),
      apartment: apartment ? `Current: ${apartment.name}` : "Current Landlord",
      apartmentId: apartment?.id ?? null,
      unreadCount: unreadCountByConversation.get(conversationKey) ?? 0,
    });
    return acc;
  }, []);

  const activeConversations = new Set(myLandlord.map((landlord) => landlord.conversationKey));

  const chatQuery = supabase
    .from("chat")
    .select(`
      receiver:users!chat_receiver_id_fkey (
        id,
        first_name,
        last_name,
        avatar_url
      ),
      apartment:apartments!chat_apartment_id_fkey (
        id,
        name
      )
    `)
    .eq("sender_id", tenantId)
    .order("created_at", { ascending: false });

  const { data: chatRows } = await chatQuery;

  // Past Inquiries: previous landlord conversations excluding active landlord(s)
  const seenReceiverKeys = new Set<string>();
  const pastInquiries: Contact[] = (chatRows ?? []).reduce<Contact[]>((acc, row) => {
    const receiver = row.receiver as { id: string; first_name: string; last_name: string; avatar_url: string | null } | null;
    const apartment = row.apartment as { id: string; name: string } | null;

    if (!receiver || !apartment?.id) return acc;

    const conversationKey = `${receiver.id}:${apartment.id}`;
    if (activeConversations.has(conversationKey) || seenReceiverKeys.has(conversationKey)) {
      return acc;
    }

    seenReceiverKeys.add(conversationKey);
    acc.push({
      id: receiver.id,
      conversationKey,
      name: `${receiver.first_name} ${receiver.last_name}`.trim(),
      avatar: resolveAvatar(receiver.avatar_url),
      apartment: apartment ? `Previous inquiry: ${apartment.name}` : "Previous inquiry",
      apartmentId: apartment?.id ?? null,
      unreadCount: unreadCountByConversation.get(conversationKey) ?? 0,
    });

    return acc;
  }, []);

  return (
    <section className="h-[calc(100svh-var(--navbar-height,4rem))] overflow-hidden">
      <MessagesClient
        myLandlord={myLandlord}
        pastInquiries={pastInquiries}
        currentUserId={tenantId}
      />
    </section>
  );
}
  