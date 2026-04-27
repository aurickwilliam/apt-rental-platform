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
        name
      )
    `)
    .eq("tenant_id", tenantId)
    .eq("status", "active");

  // My Landlord: active landlord relationship(s) for this tenant
  const seenLandlordIds = new Set<string>();
  const myLandlord: Contact[] = (tenancyRows ?? []).reduce<Contact[]>((acc, row) => {
    const landlord = row.landlord as { id: string; first_name: string; last_name: string; avatar_url: string | null } | null;
    const apartment = row.apartment as { name: string } | null;
    if (!landlord || seenLandlordIds.has(landlord.id)) return acc;

    seenLandlordIds.add(landlord.id);
    acc.push({
      id: landlord.id,
      name: `${landlord.first_name} ${landlord.last_name}`.trim(),
      avatar: resolveAvatar(landlord.avatar_url),
      apartment: apartment ? `Current: ${apartment.name}` : "Current Landlord",
    });
    return acc;
  }, []);

  const activeLandlordIds = myLandlord.map((landlord) => landlord.id);

  let chatQuery = supabase
    .from("chat")
    .select(`
      receiver:users!chat_receiver_id_fkey (
        id,
        first_name,
        last_name,
        avatar_url
      ),
      apartment:apartments!chat_apartment_id_fkey (
        name
      )
    `)
    .eq("sender_id", tenantId)
    .order("created_at", { ascending: false });

  if (activeLandlordIds.length > 0) {
    chatQuery = chatQuery.not("receiver_id", "in", `(${activeLandlordIds.join(",")})`);
  }

  const { data: chatRows } = await chatQuery;

  // Past Inquiries: previous landlord conversations excluding active landlord(s)
  const seenReceiverIds = new Set<string>();
  const pastInquiries: Contact[] = (chatRows ?? []).reduce<Contact[]>((acc, row) => {
    const receiver = row.receiver as { id: string; first_name: string; last_name: string; avatar_url: string | null } | null;
    const apartment = row.apartment as { name: string } | null;

    if (!receiver || seenReceiverIds.has(receiver.id)) return acc;

    seenReceiverIds.add(receiver.id);
    acc.push({
      id: receiver.id,
      name: `${receiver.first_name} ${receiver.last_name}`.trim(),
      avatar: resolveAvatar(receiver.avatar_url),
      apartment: apartment ? `Inquired: ${apartment.name}` : "Past Inquiry",
    });

    return acc;
  }, []);

  return (
    <MessagesClient
      myLandlord={myLandlord}
      pastInquiries={pastInquiries}
      currentUserId={tenantId}
    />
  );
}
  