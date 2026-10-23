/** A stable key for the local calendar day of a timestamp; precompute it once per message. */
export function getChatDayKey(createdAt: string): string {
  return new Date(createdAt).toDateString();
}

/** True when two ISO timestamps fall on the same local calendar day. */
export function isSameChatDay(a: string, b: string): boolean {
  return getChatDayKey(a) === getChatDayKey(b);
}

/** Day divider text in a chat thread, e.g. "Oct 20, 2026". */
export function formatChatDayLabel(createdAt: string): string {
  return new Date(createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
}
