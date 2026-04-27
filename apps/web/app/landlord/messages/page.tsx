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
    };
  });

  // Active tenant IDs to exclude from inquiries
  const activeTenantIds = currentTenants.map((t) => t.id);

  // Inquiries: users who messaged the landlord but aren't active tenants
  const { data: chatRows } = await supabase
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
    .not("sender_id", "in", `(${activeTenantIds.join(",")})`)
    .order("created_at", { ascending: false });

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