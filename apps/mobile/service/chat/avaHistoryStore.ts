import AsyncStorage from "@react-native-async-storage/async-storage";
import { parseSavedAvaChats, type AvaSavedChat } from "@repo/utils";

// Ava's saved conversations stay on this device, per auth account, so a shared
// phone never shows another account's chats. Best-effort: a storage failure
// just means no history. Shape and limits are shared with web in
// `@repo/utils` (`avaHistory.ts`).
const KEY_PREFIX = "apt-ava-chats:v1:";

export const avaHistoryKey = (authUserId: string) => `${KEY_PREFIX}${authUserId}`;

export async function loadAvaChats(authUserId: string): Promise<AvaSavedChat[]> {
  try {
    const raw = await AsyncStorage.getItem(avaHistoryKey(authUserId));
    return parseSavedAvaChats(raw ? JSON.parse(raw) : []);
  } catch {
    return [];
  }
}

export async function saveAvaChats(authUserId: string, chats: AvaSavedChat[]): Promise<void> {
  try {
    await AsyncStorage.setItem(avaHistoryKey(authUserId), JSON.stringify(chats));
  } catch {
    // Best-effort only.
  }
}
