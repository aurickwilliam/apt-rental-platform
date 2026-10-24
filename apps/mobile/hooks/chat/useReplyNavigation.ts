import { useCallback, useEffect, useRef, useState, type RefObject } from 'react';
import type { FlatList } from 'react-native';

import type { Message } from '@/service/chat/chatService';

/** At most this many older pages are walked looking for a quoted message. */
export const MAX_REPLY_LOOKUP_PAGES = 5;
export const REPLY_HIGHLIGHT_MS = 1800;

export type ReplyLookupNotice = 'unavailable' | 'limit' | 'error';

const NOTICE_TEXT: Record<ReplyLookupNotice, string> = {
  unavailable: 'Original message unavailable.',
  limit: 'Original message is farther back. Scroll up to load more and try again.',
  error: "Couldn't locate the original message. Please try again.",
};

export function replyLookupNoticeText(notice: ReplyLookupNotice): string {
  return NOTICE_TEXT[notice];
}

interface ReplyLookupOptions {
  findIndex: () => number;
  hasMore: () => boolean;
  loadOlder: () => Promise<{ hasMore: boolean } | null>;
  /** Resolves once the list has rendered the page that was just loaded. */
  afterRender: () => Promise<void>;
  isCancelled: () => boolean;
}

export type ReplyLookupResult =
  | { status: 'found'; index: number }
  | { status: ReplyLookupNotice | 'cancelled' };

/**
 * Finds a quoted message, loading older history page by page when it isn't on
 * screen yet (web's `locateReplyMessage`). Reads go through the existing,
 * authorized history loader; this only decides when to stop.
 */
export async function locateReplyMessage({
  findIndex,
  hasMore,
  loadOlder,
  afterRender,
  isCancelled,
}: ReplyLookupOptions): Promise<ReplyLookupResult> {
  let index = findIndex();
  if (index >= 0) return { status: 'found', index };

  let canLoad = hasMore();
  for (let page = 0; page < MAX_REPLY_LOOKUP_PAGES && canLoad; page++) {
    const result = await loadOlder();
    if (isCancelled()) return { status: 'cancelled' };
    if (!result) return { status: 'error' };
    await afterRender();
    if (isCancelled()) return { status: 'cancelled' };
    index = findIndex();
    if (index >= 0) return { status: 'found', index };
    canLoad = result.hasMore;
  }
  return { status: canLoad ? 'limit' : 'unavailable' };
}

const nextFrame = () => new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));

interface UseReplyNavigationOptions {
  messages: Message[];
  hasMore: boolean;
  loadOlderMessages: () => Promise<{ hasMore: boolean } | null>;
  listRef: RefObject<FlatList | null>;
  onNotice: (message: string) => void;
}

/**
 * Tapping the quote above a reply scrolls to the original bubble and flashes it
 * (web's `useReplyNavigation`). The list is inverted and newest-first, so a
 * message's list index is its position in `messages`.
 */
export function useReplyNavigation({
  messages,
  hasMore,
  loadOlderMessages,
  listRef,
  onNotice,
}: UseReplyNavigationOptions) {
  const latest = useRef({ messages, hasMore, loadOlderMessages, onNotice });
  const generation = useRef(0);
  const highlightTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [highlightedId, setHighlightedId] = useState<string | null>(null);

  useEffect(() => {
    latest.current = { messages, hasMore, loadOlderMessages, onNotice };
  });
  useEffect(() => () => {
    generation.current += 1;
    if (highlightTimer.current) clearTimeout(highlightTimer.current);
  }, []);

  const jumpToOriginal = useCallback(
    async (messageId: string) => {
      const mine = ++generation.current;
      if (highlightTimer.current) clearTimeout(highlightTimer.current);
      setHighlightedId(null);

      const result = await locateReplyMessage({
        findIndex: () => latest.current.messages.findIndex((m) => m.id === messageId),
        hasMore: () => latest.current.hasMore,
        loadOlder: () => latest.current.loadOlderMessages(),
        afterRender: nextFrame,
        isCancelled: () => generation.current !== mine,
      });
      if (result.status === 'cancelled' || generation.current !== mine) return;

      if (result.status !== 'found') {
        latest.current.onNotice(replyLookupNoticeText(result.status));
        return;
      }

      listRef.current?.scrollToIndex({ index: result.index, animated: true, viewPosition: 0.5 });
      setHighlightedId(messageId);
      highlightTimer.current = setTimeout(() => {
        if (generation.current === mine) setHighlightedId(null);
      }, REPLY_HIGHLIGHT_MS);
    },
    [listRef]
  );

  /** FlatList can't scroll to rows it hasn't measured: jump near it, then retry. */
  const onScrollToIndexFailed = useCallback(
    (info: { index: number; averageItemLength: number }) => {
      listRef.current?.scrollToOffset({ offset: info.averageItemLength * info.index, animated: false });
      setTimeout(() => {
        listRef.current?.scrollToIndex({ index: info.index, animated: true, viewPosition: 0.5 });
      }, 120);
    },
    [listRef]
  );

  return { jumpToOriginal, highlightedId, onScrollToIndexFailed };
}
