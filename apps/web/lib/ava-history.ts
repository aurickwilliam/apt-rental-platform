// Ava's saved conversations live in this browser, per account, never on the
// server (the same device-only rule as recent searches). Best-effort: a
// storage failure just means no history. The shape and limits are shared with
// mobile in `@repo/utils` (`avaHistory.ts`).
import { parseSavedAvaChats, type AvaSavedChat } from "@repo/utils";

const KEY_PREFIX = "apt-ava-chats:v1:";

export function avaHistoryKey(authUserId: string): string {
  return `${KEY_PREFIX}${authUserId}`;
}

export function loadAvaChats(authUserId: string | null | undefined): AvaSavedChat[] {
  if (!authUserId) return [];
  try {
    const raw = window.localStorage.getItem(avaHistoryKey(authUserId));
    return parseSavedAvaChats(raw ? JSON.parse(raw) : []);
  } catch {
    return [];
  }
}

export function saveAvaChats(authUserId: string | null | undefined, chats: AvaSavedChat[]): void {
  if (!authUserId) return;
  try {
    window.localStorage.setItem(avaHistoryKey(authUserId), JSON.stringify(chats));
  } catch {
    // Best-effort only.
  }
}
