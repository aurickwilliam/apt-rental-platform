import type { NotificationRow } from "@/service/notifications/notificationService";

import type { NotificationData } from "@/utils/notificationDeepLink";

function getOpenChatConversationKey(pathname: string): string | null {
  const CHAT_PREFIX = "/chat/";
  if (!pathname.startsWith(CHAT_PREFIX)) return null;

  try {
    return decodeURIComponent(pathname.slice(CHAT_PREFIX.length));
  } catch {
    return null;
  }
}

/**
 * Returns true when a message notification belongs to the chat the user is
 * already viewing. The chat screen shows incoming messages in realtime, so a
 * toast (and its tap-through to the same chat) would be redundant noise.
 */
export function shouldSuppressChatToast(
  row: Pick<NotificationRow, "type" | "data">,
  pathname: string,
): boolean {
  if (row.type !== "message") return false;

  const conversationKey = (row.data as NotificationData | null)?.conversationKey;
  if (typeof conversationKey !== "string") return false;

  const openKey = getOpenChatConversationKey(pathname);
  return openKey !== null && openKey === conversationKey;
}
