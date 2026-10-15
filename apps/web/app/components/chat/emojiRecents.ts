/**
 * Recently-used emoji, persisted per browser.
 *
 * Mirrors mobile's `service/chat/emojiRecentsStorage.ts`, which keeps the same
 * list in AsyncStorage — so the ordering rule matches across platforms: the
 * most recently picked emoji first, no duplicates, capped.
 */

const STORAGE_KEY = "apt-web-emoji-recents";

const MAX_RECENTS = 24;

/**
 * Reads the stored recents. Storage access can throw (private mode, disabled
 * cookies, quota), so every entry point degrades to "no recents" rather than
 * breaking the picker.
 */
export function readEmojiRecents(): string[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item): item is string => typeof item === "string");
  } catch {
    return [];
  }
}

/** Moves `emoji` to the front of the recents, or adds it when absent. */
export function rememberEmoji(emoji: string): string[] {
  const next = [emoji, ...readEmojiRecents().filter((item) => item !== emoji)].slice(
    0,
    MAX_RECENTS
  );

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Recents are a convenience; a failed write just means they don't persist.
  }

  return next;
}