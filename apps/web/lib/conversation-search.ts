import type { ConversationContact } from "./conversation-contacts";

// Searching the Messages list. Matching is local to the loaded conversations
// (contact name and apartment name). Recent search terms are kept in this
// browser per account, never on the server, so a shared computer never shows
// another account's history. Best-effort: storage failures just mean no recents.

export const MAX_RECENT_MESSAGE_SEARCHES = 5;
const MAX_TERM_LENGTH = 60;
const KEY_PREFIX = "apt-recent-message-searches:";

const normalize = (value: string) => value.toLocaleLowerCase().replace(/\s+/g, " ").trim();

/**
 * Keeps the conversations whose contact name or apartment name contains every
 * word of `query`, in any order. A blank query keeps everything. A contact with
 * no linked apartment is matched on its name only (its subtitle is a placeholder).
 */
export function filterConversationContacts<T extends ConversationContact>(contacts: readonly T[], query: string): T[] {
  const words = normalize(query).split(" ").filter(Boolean);
  if (words.length === 0) return [...contacts];
  return contacts.filter((contact) => {
    const haystack = normalize(`${contact.name} ${contact.apartmentId ? contact.apartment : ""}`);
    return words.every((word) => haystack.includes(word));
  });
}

export function recentMessageSearchesKey(authUserId: string | null | undefined): string {
  return `${KEY_PREFIX}${authUserId ?? "guest"}`;
}

/** Adds `term` to the front, dropping an older copy (any letter case) and keeping the newest few. */
export function addRecentMessageSearch(current: readonly string[], term: string): string[] {
  const clean = term.replace(/\s+/g, " ").trim().slice(0, MAX_TERM_LENGTH);
  if (!clean) return [...current];
  const key = clean.toLocaleLowerCase();
  return [clean, ...current.filter((item) => item.toLocaleLowerCase() !== key)].slice(0, MAX_RECENT_MESSAGE_SEARCHES);
}

export function parseRecentMessageSearches(raw: string | null): string[] {
  try {
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((item): item is string => typeof item === "string" && item.trim() !== "")
      .slice(0, MAX_RECENT_MESSAGE_SEARCHES);
  } catch {
    return [];
  }
}

export function loadRecentMessageSearches(authUserId: string | null | undefined): string[] {
  try {
    return parseRecentMessageSearches(window.localStorage.getItem(recentMessageSearchesKey(authUserId)));
  } catch {
    return [];
  }
}

export function saveRecentMessageSearches(authUserId: string | null | undefined, terms: readonly string[]): void {
  try {
    window.localStorage.setItem(recentMessageSearchesKey(authUserId), JSON.stringify(terms));
  } catch {
    // Best-effort only.
  }
}
