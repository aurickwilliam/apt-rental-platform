import { supabase } from "@repo/supabase";

import {
  getConversations,
  getConversationsV2,
  toMessageType,
  type Conversation,
  type MessageType,
} from "./chatService";

export type ConversationWithMeta = Conversation & {
  last_sender_is_me?: boolean;
  last_message_type?: string | null;
  conversation_type?: "tenant" | "inquiry";
};

export type ConversationRole = "tenant" | "landlord";

/**
 * PostgREST error code for "could not find the function in the schema cache".
 * Raised when get_conversations_v2 does not exist yet because the migration
 * has not reached this client's project (deployment-order condition) — the
 * only situation where the legacy path is allowed to run.
 */
const V2_UNAVAILABLE_CODE = "PGRST202";

function getConversationMetaKey(otherUserId: string, apartmentId: string | null): string {
  return `${otherUserId}:${apartmentId ?? "none"}`;
}

type ChatMetadataRow = {
  sender_id: string;
  receiver_id: string;
  apartment_id: string | null;
  message_type: string;
};

/**
 * Legacy fallback: the pre-v2 conversation list. Calls the original RPC and
 * scans chat/tenancies rows for last-sender / last-message-type metadata.
 * Kept verbatim as the temporary compatibility path for clients running
 * before the get_conversations_v2 migration is deployed.
 */
async function fetchLegacyConversationsWithMetadata(
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

export async function fetchConversationsWithMetadata(
  myId: string,
  role: ConversationRole
): Promise<ConversationWithMeta[]> {
  try {
    const rows = await getConversationsV2();

    return rows.map((conv) => ({
      ...conv,
      last_sender_is_me: conv.last_sender_id === myId,
      last_message_type: toMessageType(conv.last_message_type) ?? "text",
    }));
  } catch (error) {
    const code = (error as { code?: string }).code;
    if (code === V2_UNAVAILABLE_CODE) {
      console.warn(
        "[conversations] get_conversations_v2 is not deployed yet; using legacy list."
      );
      return fetchLegacyConversationsWithMetadata(myId, role);
    }

    // Permission, data, or unexpected database errors must surface — never
    // silently masked by the fallback.
    throw error;
  }
}