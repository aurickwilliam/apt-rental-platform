import AsyncStorage from '@react-native-async-storage/async-storage';

import type { RecentPicksPersistenceConfig } from 'rn-emoji-keyboard/lib/typescript/types';

// Recently used emoji, kept on this device across launches (a UI preference,
// never synced). Stored as the picker library's own emoji entries.
export const EMOJI_RECENTS_STORAGE_KEY = 'chat:emoji-recent-picks';

type RecentEmojis = Awaited<ReturnType<RecentPicksPersistenceConfig['initialization']>>;

export async function loadRecentEmojis(): Promise<RecentEmojis> {
  try {
    const raw = await AsyncStorage.getItem(EMOJI_RECENTS_STORAGE_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? (parsed as RecentEmojis) : [];
  } catch (error) {
    console.warn('[chat] Could not load recent emoji:', error);
    return [];
  }
}

export async function saveRecentEmojis(recent: Readonly<RecentEmojis>): Promise<void> {
  try {
    await AsyncStorage.setItem(EMOJI_RECENTS_STORAGE_KEY, JSON.stringify(recent));
  } catch (error) {
    console.warn('[chat] Could not save recent emoji:', error);
  }
}
