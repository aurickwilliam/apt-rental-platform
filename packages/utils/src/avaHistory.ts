// Saved Ava conversations (the history list), shared by web and mobile. Chats
// are stored on the device per account (never on the server). Only chat text,
// quick replies and the remembered search are kept; listings are stored as ids
// and re-read when a chat is opened, so a reopened chat never shows stale
// prices or a listing that is no longer visible.

import { sanitizeAiFilters } from './aiSearch';
import type { AvaSearchState } from './avaChat';

export const AVA_MAX_SAVED_CHATS = 30;
export const AVA_MAX_SAVED_MESSAGES = 60;
const MAX_TITLE_LENGTH = 48;
const MAX_TEXT_LENGTH = 2000;
const DAY_MS = 24 * 60 * 60 * 1000;

export interface AvaSavedMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  quickReplies?: string[];
  /** Why each listing was recommended, by listing id. */
  notes?: Record<string, string>;
  search?: AvaSearchState;
  shownIds?: string[];
  /** The listings shown, in order; their details are re-read when the chat opens. */
  listingIds?: string[];
}

export interface AvaSavedChat {
  id: string;
  title: string;
  updatedAt: number;
  messages: AvaSavedMessage[];
}

export type AvaHistoryGroupLabel = 'today' | 'week' | 'older';

export interface AvaHistoryGroup {
  label: AvaHistoryGroupLabel;
  chats: AvaSavedChat[];
}

/** The chat's name: its first question, shortened. */
export function avaChatTitle(messages: { role: string; text: string }[]): string {
  const first = messages.find((message) => message.role === 'user' && message.text.trim() !== '');
  const text = (first?.text ?? '').replace(/\s+/g, ' ').trim();
  if (!text) return 'New chat';
  return text.length > MAX_TITLE_LENGTH ? `${text.slice(0, MAX_TITLE_LENGTH - 1).trimEnd()}…` : text;
}

/** Puts `chat` first (newest), replacing an older copy, and keeps the newest few. */
export function upsertAvaChat(chats: AvaSavedChat[], chat: AvaSavedChat): AvaSavedChat[] {
  return [chat, ...chats.filter((item) => item.id !== chat.id)]
    .sort((a, b) => b.updatedAt - a.updatedAt)
    .slice(0, AVA_MAX_SAVED_CHATS);
}

export function removeAvaChat(chats: AvaSavedChat[], id: string): AvaSavedChat[] {
  return chats.filter((chat) => chat.id !== id);
}

const isStringArray = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every((item) => typeof item === 'string');

function parseMessage(value: unknown): AvaSavedMessage | null {
  if (!value || typeof value !== 'object') return null;
  const item = value as Record<string, unknown>;
  if (typeof item.id !== 'string' || typeof item.text !== 'string') return null;
  if (item.role !== 'user' && item.role !== 'assistant') return null;

  const message: AvaSavedMessage = {
    id: item.id,
    role: item.role,
    text: item.text.slice(0, MAX_TEXT_LENGTH),
  };
  if (isStringArray(item.quickReplies)) message.quickReplies = item.quickReplies.slice(0, 6);
  if (isStringArray(item.shownIds)) message.shownIds = item.shownIds;
  if (isStringArray(item.listingIds)) message.listingIds = item.listingIds;
  if (item.notes && typeof item.notes === 'object') {
    const entries = Object.entries(item.notes as Record<string, unknown>).filter(
      (entry): entry is [string, string] => typeof entry[1] === 'string',
    );
    message.notes = Object.fromEntries(entries);
  }
  if (item.search && typeof item.search === 'object') {
    const search = item.search as Record<string, unknown>;
    message.search = {
      filters: sanitizeAiFilters(search.filters),
      landmarkKey: typeof search.landmarkKey === 'string' ? search.landmarkKey : null,
    };
  }
  return message;
}

/** Reads saved chats from untrusted storage; anything malformed is dropped. */
export function parseSavedAvaChats(raw: unknown): AvaSavedChat[] {
  if (!Array.isArray(raw)) return [];
  const chats: AvaSavedChat[] = [];

  for (const value of raw) {
    if (!value || typeof value !== 'object') continue;
    const item = value as Record<string, unknown>;
    if (typeof item.id !== 'string' || typeof item.updatedAt !== 'number' || !Array.isArray(item.messages)) {
      continue;
    }
    const messages = item.messages
      .map(parseMessage)
      .filter((message): message is AvaSavedMessage => message !== null)
      .slice(-AVA_MAX_SAVED_MESSAGES);
    if (messages.length === 0) continue;
    chats.push({
      id: item.id,
      title: typeof item.title === 'string' && item.title.trim() ? item.title.slice(0, 80) : avaChatTitle(messages),
      updatedAt: item.updatedAt,
      messages,
    });
  }

  return chats.sort((a, b) => b.updatedAt - a.updatedAt).slice(0, AVA_MAX_SAVED_CHATS);
}

/** Today, the last 7 days, then older; empty groups are left out. */
export function groupAvaChatsByAge(chats: AvaSavedChat[], now: number = Date.now()): AvaHistoryGroup[] {
  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);
  const todayStart = startOfToday.getTime();

  const groups: AvaHistoryGroup[] = [
    { label: 'today', chats: chats.filter((chat) => chat.updatedAt >= todayStart) },
    {
      label: 'week',
      chats: chats.filter((chat) => chat.updatedAt < todayStart && chat.updatedAt >= todayStart - 7 * DAY_MS),
    },
    { label: 'older', chats: chats.filter((chat) => chat.updatedAt < todayStart - 7 * DAY_MS) },
  ];
  return groups.filter((group) => group.chats.length > 0);
}
