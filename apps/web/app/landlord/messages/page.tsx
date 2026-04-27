import { redirect } from "next/navigation";

import { createClient } from "@repo/supabase/server";

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

  // Get unread message counts for all conversations involving this landlord
  const { data: unreadRows } = await supabase
    .from("chat")
    .select("sender_id")
    .eq("receiver_id", landlordId)
    .eq("is_read", false);

  const unreadCountBySender = (unreadRows ?? []).reduce<Map<string, number>>((acc, row) => {
    const senderId = row.sender_id;
    acc.set(senderId, (acc.get(senderId) ?? 0) + 1);
    return acc;
  }, new Map<string, number>());

  // Current Tenants: active tenancies under this landlord
  const { data: tenancyRows } = await supabase
    .from("tenancies")
    .select(`
      tenant:users!tenancies_tenant_id_fkey (
        id,
        first_name,
        last_name,
        avatar_url
      ),
      apartment:apartments!tenancies_apartment_id_fkey (
        name
      )
    `)
    .eq("landlord_id", landlordId)
    .eq("status", "active");

  const currentTenants: Contact[] = (tenancyRows ?? []).map((row) => {
    const tenant = row.tenant as { id: string; first_name: string; last_name: string; avatar_url: string | null };
    const apartment = row.apartment as { name: string };
    return {
      id: tenant.id,
      name: `${tenant.first_name} ${tenant.last_name}`.trim(),
      avatar: tenant.avatar_url ?? `https://i.pravatar.cc/150?u=${tenant.id}`,
      apartment: apartment.name,
      unreadCount: unreadCountBySender.get(tenant.id) ?? 0,
    };
  });

  // Active tenant IDs to exclude from inquiries
  const activeTenantIds = currentTenants.map((t) => t.id);

  // Inquiries: users who messaged the landlord but aren't active tenants
  let chatQuery = supabase
    .from("chat")
    .select(`
      sender:users!chat_sender_id_fkey (
        id,
        first_name,
        last_name,
        avatar_url
      ),
      apartment:apartments!chat_apartment_id_fkey (
        name
      )
    `)
    .eq("receiver_id", landlordId)
    .order("created_at", { ascending: false });

  if (activeTenantIds.length > 0) {
    chatQuery = chatQuery.not("sender_id", "in", `(${activeTenantIds.join(",")})`);
  }

  const { data: chatRows } = await chatQuery;

  // Deduplicate by sender id, keep the most recent chat row per sender
  const seenIds = new Set<string>();
  const inquiries: Contact[] = (chatRows ?? []).reduce<Contact[]>((acc, row) => {
    const sender = row.sender as { id: string; first_name: string; last_name: string; avatar_url: string | null };
    const apartment = row.apartment as { name: string } | null;
    if (!seenIds.has(sender.id)) {
      seenIds.add(sender.id);
      acc.push({
        id: sender.id,
        name: `${sender.first_name} ${sender.last_name}`.trim(),
        avatar: sender.avatar_url ?? `https://i.pravatar.cc/150?u=${sender.id}`,
        apartment: apartment ? `Inquiring: ${apartment.name}` : "Inquiring",
        unreadCount: unreadCountBySender.get(sender.id) ?? 0,
      });
    }
    return acc;
  }, []);

  return (
    <MessagesClient
      currentTenants={currentTenants}
      inquiries={inquiries}
      currentUserId={landlordId}
    />
  );
}