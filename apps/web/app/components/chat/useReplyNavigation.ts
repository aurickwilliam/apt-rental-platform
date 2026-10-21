"use client";

import { useCallback, useEffect, useRef, useState, type RefObject } from "react";
import type { EarlierMessagesPage } from "./useConversation";
import { centerReplyTarget, findReplyTarget, locateReplyMessage, waitForReplyWork, REPLY_HIGHLIGHT_MS, REPLY_LOOKUP_TIMEOUT_MS } from "./replyNavigation";

interface ReplyNavigationOptions {
  conversationKey: string | null;
  scrollRef: RefObject<HTMLDivElement | null>;
  hasEarlierMessages: boolean;
  loadEarlierMessages: (signal?: AbortSignal) => Promise<EarlierMessagesPage | null>;
  pauseFollowing: () => void;
}

interface NavigationState {
  key: string | null;
  loading: boolean;
  highlightedId: string | null;
  notice: string | null;
}

function afterRender(signal: AbortSignal): Promise<void> {
  return new Promise((resolve) => {
    if (signal.aborted) { resolve(); return; }
    const finish = () => { signal.removeEventListener("abort", finish); resolve(); };
    signal.addEventListener("abort", finish, { once: true });
    requestAnimationFrame(() => requestAnimationFrame(finish));
  });
}

export default function useReplyNavigation(options: ReplyNavigationOptions) {
  const { conversationKey } = options;
  const latest = useRef(options);
  const active = useRef<{ id: string; key: string; controller: AbortController; task: Promise<void> } | null>(null);
  const highlightTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [state, setState] = useState<NavigationState>({ key: null, loading: false, highlightedId: null, notice: null });

  useEffect(() => { latest.current = options; });
  useEffect(() => () => {
    active.current?.controller.abort();
    if (highlightTimer.current) clearTimeout(highlightTimer.current);
  }, [conversationKey]);

  const dismiss = useCallback(() => {
    active.current?.controller.abort();
    if (highlightTimer.current) clearTimeout(highlightTimer.current);
    setState({ key: conversationKey, loading: false, highlightedId: null, notice: null });
  }, [conversationKey]);

  const jumpToOriginal = useCallback((id: string) => {
    if (!conversationKey) return;
    const previous = active.current;
    if (previous?.id === id && previous.key === conversationKey && !previous.controller.signal.aborted) return;
    previous?.controller.abort();
    if (highlightTimer.current) clearTimeout(highlightTimer.current);
    const controller = new AbortController();
    const { signal } = controller;
    const isCurrent = () => !signal.aborted && latest.current.conversationKey === conversationKey;
    latest.current.pauseFollowing();
    setState({ key: conversationKey, loading: true, highlightedId: null, notice: "Locating original message…" });
    const task = (async () => {
      await previous?.task;
      if (!isCurrent()) return;
      const timeout = setTimeout(() => {
        if (!isCurrent()) return;
        controller.abort();
        setState({ key: conversationKey, loading: false, highlightedId: null, notice: "Couldn't locate the original message. Please try again." });
      }, REPLY_LOOKUP_TIMEOUT_MS);
      try {
        const container = latest.current.scrollRef.current;
        if (!container) {
          setState({ key: conversationKey, loading: false, highlightedId: null, notice: "Original message unavailable." });
          return;
        }
        const result = await locateReplyMessage({
          signal,
          findTarget: () => Boolean(findReplyTarget(container, id)),
          hasEarlier: () => latest.current.hasEarlierMessages,
          loadEarlier: async () => {
            const height = container.scrollHeight;
            const top = container.scrollTop;
            const page = await waitForReplyWork(latest.current.loadEarlierMessages(signal), signal);
            await afterRender(signal);
            if (isCurrent()) container.scrollTop = top + container.scrollHeight - height;
            return page;
          },
        });
        if (!isCurrent()) return;
        const target = result === "found" ? findReplyTarget(container, id) : null;
        if (target) {
          centerReplyTarget(container, target, window.matchMedia("(prefers-reduced-motion: reduce)").matches);
          setState({ key: conversationKey, loading: false, highlightedId: id, notice: null });
          highlightTimer.current = setTimeout(() => {
            if (isCurrent()) setState({ key: conversationKey, loading: false, highlightedId: null, notice: null });
          }, REPLY_HIGHLIGHT_MS);
        } else {
          setState({ key: conversationKey, loading: false, highlightedId: null, notice: result === "limit"
            ? "Original message is farther back. Load earlier messages and try again."
            : result === "error" ? "Couldn't locate the original message. Please try again." : "Original message unavailable." });
        }
      } catch (error) {
        if (isCurrent()) {
          console.error("Failed to locate reply original:", error);
          setState({ key: conversationKey, loading: false, highlightedId: null, notice: "Couldn't locate the original message. Please try again." });
        }
      } finally {
        clearTimeout(timeout);
        if (active.current?.controller === controller) active.current = null;
      }
    })();
    active.current = { id, key: conversationKey, controller, task };
  }, [conversationKey]);

  const current = state.key === conversationKey;
  return { jumpToOriginal, dismiss, locating: current && state.loading, highlightedId: current ? state.highlightedId : null, notice: current ? state.notice : null };
}
