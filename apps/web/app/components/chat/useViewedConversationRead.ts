"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type RefObject } from "react";
import type { createClient } from "@repo/supabase/browser";
import { useNotifications } from "@/hooks/use-notifications";
import { useNotificationReadRetry } from "@/hooks/use-notification-read-retry";
import { ReadAcknowledgementQueue } from "@/lib/read-acknowledgement-queue";
import { compareReadTimestamps, conversationNotificationReadIds, type ViewedConversationWindow } from "@/lib/notification-read-state";
import { readViewedConversation } from "@/service/conversationReadService";
import type { ChatMessage } from "./types";

interface Options {
  supabase: ReturnType<typeof createClient>;
  portal: "tenant" | "landlord";
  currentUserId: string;
  contactId: string | null;
  apartmentId: string | null;
  conversationKey: string | null;
  messages: ChatMessage[];
  loading: boolean;
  scrollRef: RefObject<HTMLDivElement | null>;
  onRead?: (key: string, remaining: number, through: string) => void;
  applyRead: (ids: string[]) => void;
}

export default function useViewedConversationRead(options: Options) {
  const { portal, currentUserId, contactId, apartmentId, conversationKey, supabase, messages, loading, scrollRef } = options;
  const feed = useNotifications(portal);
  const scopeKey = feed.ownerKey && feed.viewerId === currentUserId && contactId && conversationKey
    ? `${feed.ownerKey}:${portal}:${conversationKey}` : null;
  const queueRef = useRef<ReadAcknowledgementQueue<ViewedConversationWindow | null> | null>(null);
  const callbacks = useRef(options);
  const [windowState, setWindowState] = useState<{ key: string; window: ViewedConversationWindow } | null>(null);
  const [failure, setFailure] = useState<{ key: string; message: string } | null>(null);
  useEffect(() => { callbacks.current = options; }, [options]);
  const visible = useCallback(() => {
    const root = scrollRef.current;
    if (!root || document.visibilityState !== "visible" || !document.hasFocus() || root.closest('[inert], [aria-hidden="true"]')) return false;
    const rect = root.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0 && rect.bottom > 0 && rect.top < window.innerHeight;
  }, [scrollRef]);

  useEffect(() => {
    if (!scopeKey || !contactId || !conversationKey) return;
    const queue = new ReadAcknowledgementQueue<ViewedConversationWindow | null>({
      visible,
      read: ids => readViewedConversation(supabase, { viewerId: currentUserId, peerId: contactId, apartmentId }, ids),
      confirmed: result => {
        if (!result) return;
        setFailure(null);
        callbacks.current.applyRead(result.messageIds);
        callbacks.current.onRead?.(conversationKey, result.unreadCount, result.through);
        setWindowState(previous => {
          if (previous?.key !== scopeKey) return { key: scopeKey, window: result };
          return { key: scopeKey, window: { ...result,
            through: compareReadTimestamps(previous.window.through, result.through) < 0 ? previous.window.through : result.through,
            messageIds: [...new Set([...previous.window.messageIds, ...result.messageIds])],
            readTimestamps: [...new Set([...previous.window.readTimestamps, ...result.readTimestamps])],
          } };
        });
      },
      failed: () => setFailure({ key: scopeKey, message: "Couldn't save message read status. Retry or return to this conversation to reconcile." }),
    });
    queueRef.current = queue;
    return () => { queue.dispose(); if (queueRef.current === queue) queueRef.current = null; };
  }, [apartmentId, contactId, conversationKey, currentUserId, scopeKey, supabase, visible]);

  useEffect(() => {
    const root = scrollRef.current;
    if (!root || loading || !scopeKey) return;
    const eligible = new Set(messages.filter(message => !message.isPending && message.sender_id === contactId &&
      message.receiver_id === currentUserId && (message.apartment_id ?? null) === apartmentId).map(message => message.id));
    const elements = [...root.querySelectorAll<HTMLElement>("[data-chat-message-id]")].filter(element => eligible.has(element.dataset.chatMessageId ?? ""));
    const collect = () => {
      if (!visible()) return;
      const bounds = root.getBoundingClientRect();
      const ids = elements.filter(element => {
        const rect = element.getBoundingClientRect();
        return rect.width > 0 && rect.height > 0 && rect.bottom > Math.max(bounds.top, 0) && rect.top < Math.min(bounds.bottom, window.innerHeight);
      }).map(element => element.dataset.chatMessageId!);
      queueRef.current?.observe(ids);
    };
    const resume = () => { collect(); queueRef.current?.resume(); };
    const observer = new IntersectionObserver(collect, { root, threshold: 0.01 });
    for (const element of elements) observer.observe(element);
    root.addEventListener("scroll", collect, { passive: true });
    window.addEventListener("focus", resume);
    window.addEventListener("online", resume);
    document.addEventListener("visibilitychange", resume);
    collect();
    return () => {
      observer.disconnect(); root.removeEventListener("scroll", collect);
      window.removeEventListener("focus", resume); window.removeEventListener("online", resume);
      document.removeEventListener("visibilitychange", resume);
    };
  }, [apartmentId, contactId, currentUserId, loading, messages, scopeKey, scrollRef, visible]);

  const ids = useMemo(() => scopeKey && windowState?.key === scopeKey
    ? conversationNotificationReadIds(feed.notifications, portal, windowState.window) : [], [feed.notifications, portal, scopeKey, windowState]);
  const acknowledgement = useNotificationReadRetry(scopeKey ? `${scopeKey}:notifications` : null, ids, feed.markManyRead);
  const retry = useCallback(() => { queueRef.current?.resume(); acknowledgement.retry(); }, [acknowledgement]);
  return { error: (failure?.key === scopeKey ? failure.message : null) ?? acknowledgement.error, retry };
}
