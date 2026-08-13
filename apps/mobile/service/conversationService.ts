import { supabase } from "@repo/supabase";

import {
  getConversations,
  toMessageType,
  type Conversation,
  type MessageType,
} from "@/service/chatService";

export type ConversationWithMeta = Conversation & {
  last_sender_is_me?: boolean;
  last_message_type?: string | null;
  conversation_type?: "tenant" | "inquiry";
};

export type ConversationRole = "tenant" | "landlord";

function getConversationMetaKey(otherUserId: string, apartmentId: string | null): string {
  return `${otherUserId}:${apartmentId ?? "none"}`;
}

type ChatMetadataRow = {
  sender_id: string;
  receiver_id: string;
  apartment_id: string | null;
  message_type: string;
};

export async function fetchConversationsWithMetadata(
  myId: string,
  role: ConversationRole
): Promise<ConversationWithMeta[]> {
  let activeTenantConversations: Set<string> | null = null;

  if (role === "landlord") {
    const { data: tenancyRows, error: tenancyError } = await supabase
      .from("tenancies")
      .select("tenant_id, apartment_id")
      .eq("landlord_id", myId)
      .eq("status", "active");

    if (tenancyError) throw tenancyError;

    activeTenantConversations = new Set(
      (tenancyRows ?? []).map((row) =>
        getConversationMetaKey(
          row.tenant_id as string,
          (row.apartment_id as string | null) ?? null
        )
      )
    );
  }

  const data = await getConversations(myId);

  const { data: chatRows, error: chatError } = await supabase
    .from("chat")
    .select("sender_id, receiver_id, apartment_id, message_type, created_at")
    .or(`sender_id.eq.${myId},receiver_id.eq.${myId}`)
    .order("created_at", { ascending: false });

  if (chatError) throw chatError;

  const lastSenderIsMeByConversation: Record<string, boolean> = {};
  const lastMessageTypeByConversation: Record<string, MessageType> = {};
  for (const row of (chatRows ?? []) as ChatMetadataRow[]) {
    const otherUserId = row.sender_id === myId ? row.receiver_id : row.sender_id;
    const key = getConversationMetaKey(otherUserId, row.apartment_id);

    if (!(key in lastSenderIsMeByConversation)) {
      lastSenderIsMeByConversation[key] = row.sender_id === myId;
    }
    if (!(key in lastMessageTypeByConversation)) {
      lastMessageTypeByConversation[key] = toMessageType(row.message_type) ?? 'text';
    }
  }

  return data.map((conv) => {
    const conversationKey = getConversationMetaKey(conv.other_user_id, conv.apartment_id);

    return {
      ...conv,
      conversation_type:
        activeTenantConversations?.has(conversationKey) === true ? "tenant" : "inquiry",
      last_sender_is_me: lastSenderIsMeByConversation[conversationKey] ?? false,
      last_message_type: lastMessageTypeByConversation[conversationKey] ?? null,
    };
  });
}