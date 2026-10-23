"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createClient } from "@repo/supabase/browser";

import {
  attachReplyPreviews,
  groupReactions,
  toggleChatReaction,
  toReplyPreview,
} from "./chatReactions";
import { reconcileMessages, removeMessage } from "./conversationEvents";
import { broadcastMessageDeleted, canUnsendMessage, deleteChatMessage } from "./unsend";
import {
  generateAttachmentId,
  resolveAttachmentUrls,
  uploadChatAttachments,
  type StagedAttachment,
} from "./attachments";
import type { ChatMessage, ReplyPreview } from "./types";

interface UseConversationArgs {
  currentUserId: string;
  otherUserId: string | null;
  apartmentId?: string | null;
  /** Reports that new messages arrived so the contact list can mark it read. */
  onConversationRead?: (conversationId: string) => void;
  /** Called with a user-facing message when a send fails, for the error banner. */
  onSendError?: (message: string) => void;
}

export interface ContextMenuTarget {
  message: ChatMessage;
  position: { x: number; y: number };
}

type SupabaseClient = ReturnType<typeof createClient>;

/**
 * Server-side bound for both the initial window and each older-history page,
 * including the attachment rows whose private URLs need resolving.
 */
const INITIAL_MESSAGE_LIMIT = 100;

/** The oldest row loaded so far — the keyset cursor for older history. */
interface HistoryCursor {
  created_at: string;
  id: string;
}

export interface EarlierMessagesPage {
  messageIds: string[];
  hasEarlier: boolean;
}

/** The subset of `chat` an attachment insert needs back to confirm a bubble. */
interface InsertedAttachmentRow {
  id: string;
  created_at: string;
  /** Null only if the database didn't echo the write back; treated as unconfirmed. */
  attachment_path: string | null;
  attachment_thumbnail_path?: string | null;
}

/**
 * Loads a conversation's messages together with their reactions and resolved
 * reply originals. Pure with respect to React — it returns rows rather than
 * setting state, so callers decide when to apply them.
 *
 * When `olderThan` is supplied the query walks backwards from that cursor
 * (keyset pagination), so loading earlier history never re-reads rows already
 * held and can't skip past messages that share a timestamp.
 */
async function loadConversation(
  supabase: SupabaseClient,
  currentUserId: string,
  otherUserId: string,
  apartmentId: string | null,
  olderThan?: HistoryCursor | null,
  signal?: AbortSignal,
): Promise<ChatMessage[]> {
  const base = supabase
    .from("chat")
    .select("*")
    .or(
      `and(sender_id.eq.${currentUserId},receiver_id.eq.${otherUserId}),` +
        `and(sender_id.eq.${otherUserId},receiver_id.eq.${currentUserId})`
    );

  // Ordering and the limit stay on the builder, so the window is applied
  // server-side: this returns the *newest* N rows of the conversation rather
  // than the oldest N of the filtered set. Reversed back to oldest-first below.
  let query = apartmentId
    ? base.eq("apartment_id", apartmentId)
    : base.is("apartment_id", null);

  if (olderThan) {
    query = query.or(
      `created_at.lt.${olderThan.created_at},` +
        `and(created_at.eq.${olderThan.created_at},id.lt.${olderThan.id})`
    );
  }

  const pageQuery = query
    .order("created_at", { ascending: false })
    .order("id", { ascending: false })
    .limit(INITIAL_MESSAGE_LIMIT);
  const { data, error } = await (signal ? pageQuery.abortSignal(signal) : pageQuery);

  if (error) {
    if (signal) throw error;
    return [];
  }
  if (!data) return [];
  signal?.throwIfAborted();

  const rows = data as unknown as ChatMessage[];
  const messageIds = rows.map((r) => r.id);

  // Quoted originals for reply previews (text placeholder for media).
  const replyIds = [
    ...new Set(rows.map((r) => r.reply_to).filter((v): v is string => !!v)),
  ];

  // Signed URLs are produced at read time and never persisted. External URLs
  // (GIFs) are already renderable and skip signing entirely.
  const attachmentPaths = rows
    .flatMap((r) => [r.attachment_path, r.attachment_thumbnail_path])
    .filter((p): p is string => Boolean(p));
  // These reads depend on the page, not on each other. Publish only after all
  // enrichment settles, so no partially resolved attachment URLs reach a bubble.
  const [reactionResult, replyResult, signedUrls] = await Promise.all([
    messageIds.length
      ? supabase.from("chat_reactions").select("message_id, user_id, emoji").in("message_id", messageIds)
      : Promise.resolve({ data: [] }),
    replyIds.length
      ? supabase.from("chat").select("id, message, message_type, sender_id").in("id", replyIds)
      : Promise.resolve({ data: [] }),
    resolveAttachmentUrls(supabase, attachmentPaths),
  ]);
  signal?.throwIfAborted();
  const reactionsByMessage = groupReactions(
    (reactionResult.data ?? []) as { message_id: string; user_id: string; emoji: string }[],
    currentUserId
  );

  return attachReplyPreviews(
    rows,
    (replyResult.data ?? []) as Pick<ChatMessage, "id" | "message" | "message_type" | "sender_id">[],
    currentUserId
  )
    .map((m) => ({
      ...m,
      reactions: reactionsByMessage.get(m.id) ?? [],
      resolvedUrl: m.attachment_path
        ? (signedUrls.get(m.attachment_path) ?? null)
        : null,
      resolvedThumbnailUrl: m.attachment_thumbnail_path
        ? (signedUrls.get(m.attachment_thumbnail_path) ?? null)
        : null,
    }))
    .reverse();
}

/**
 * Shared conversation state for the tenant and landlord chat views: message
 * fetch (with reactions and resolved reply previews), optimistic send, reply
 * targeting, and reaction toggling.
 *
 * Reactions are applied optimistically so the badge updates on tap, then
 * rolled back if the write fails.
 */
export default function useConversation({
  currentUserId,
  otherUserId,
  apartmentId,
  onConversationRead,
  onSendError,
}: UseConversationArgs) {
  const supabase = useMemo(() => createClient(), []);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const historyCursorRef = useRef<HistoryCursor | null>(null);
  const historyGenerationRef = useRef(0);
  const earlierRequestRef = useRef<{ promise: Promise<EarlierMessagesPage | null>; signal?: AbortSignal } | null>(null);
  // False once a backwards page comes back short — there is nothing older left.
  const [hasEarlierMessages, setHasEarlierMessages] = useState(true);
  const [isLoadingEarlier, setIsLoadingEarlier] = useState(false);
  const [replyTarget, setReplyTarget] = useState<ChatMessage | null>(null);
  const [contextMenu, setContextMenu] = useState<ContextMenuTarget | null>(null);

  // Keep the callback fresh without re-subscribing the realtime channel.
  const onReadRef = useRef(onConversationRead);
  useEffect(() => {
    onReadRef.current = onConversationRead;
  }, [onConversationRead]);

  const conversationId = useMemo(
    () => (otherUserId ? [currentUserId, otherUserId].sort().join("_") : null),
    [currentUserId, otherUserId]
  );

  // Clearing on "no conversation" is a prop-to-state reset, so it happens
  // during render by comparing against the previous id rather than inside an
  // effect — `react-hooks/set-state-in-effect` is enforced in CI.
  const [prevOtherUserId, setPrevOtherUserId] = useState(otherUserId);
  if (prevOtherUserId !== otherUserId) {
    setPrevOtherUserId(otherUserId);
    if (!otherUserId) {
      setMessages([]);
      setReplyTarget(null);
      setContextMenu(null);
    }
  }

  // Loading is derived, not stored: a conversation is loading whenever it isn't
  // the one already fetched. Setting a flag before the fetch would need a
  // synchronous setState in the effect body, which cascades renders.
  const fetchKey = otherUserId ? `${otherUserId}:${apartmentId ?? "any"}` : null;
  const [loadedKey, setLoadedKey] = useState<string | null>(null);
  const isLoading = fetchKey !== null && loadedKey !== fetchKey;

  useEffect(() => {
    if (!fetchKey || !otherUserId) return;

    const generationRef = historyGenerationRef;
    const generation = ++generationRef.current;
    historyCursorRef.current = null;
    earlierRequestRef.current = null;
    let isCancelled = false;

    // Rows are applied in the promise callback, never in the effect body —
    // `loadConversation` is pure, so the linter sees no setState here.
    loadConversation(supabase, currentUserId, otherUserId, apartmentId ?? null)
      .then((hydrated) => {
        if (isCancelled) return;
        setMessages(hydrated);
        // Seed the backwards cursor from the oldest row currently held.
        const oldest = hydrated[0];
        historyCursorRef.current = oldest ? { created_at: oldest.created_at, id: oldest.id } : null;
        setIsLoadingEarlier(false);
        setHasEarlierMessages(hydrated.length === INITIAL_MESSAGE_LIMIT);
        setLoadedKey(fetchKey);
      })
      .catch((err: unknown) => {
        console.error("Failed to load messages:", err);
        // Stop the spinner even on failure; the view falls back to its empty state.
        if (!isCancelled) setLoadedKey(fetchKey);
      });

    return () => {
      isCancelled = true;
      if (generationRef.current === generation) generationRef.current++;
    };
  }, [apartmentId, currentUserId, fetchKey, otherUserId, supabase]);

  /**
 * Prepends the previous page of history. Rows already held are de-duplicated
 * by id, because a realtime insert can land between pages and the keyset
 * cursor only guarantees ordering, not exclusivity.
 */
  const loadEarlierMessages = useCallback(function loadEarlier(signal?: AbortSignal): Promise<EarlierMessagesPage | null> {
    if (signal?.aborted || !otherUserId || !historyCursorRef.current) return Promise.resolve(null);
    const pending = earlierRequestRef.current;
    if (pending) {
      if (!pending.signal?.aborted) return pending.promise;
      const generation = historyGenerationRef.current;
      return pending.promise.then(() => generation === historyGenerationRef.current ? loadEarlier(signal) : null);
    }
    const cursor = historyCursorRef.current;
    const generation = historyGenerationRef.current;
    const isCurrent = () => generation === historyGenerationRef.current && !signal?.aborted;
    setIsLoadingEarlier(true);
    const request = (async () => {
      try {
        const older = await loadConversation(supabase, currentUserId, otherUserId, apartmentId ?? null, cursor, signal);
        if (!isCurrent()) return null;
        setMessages((prev) => {
          if (generation !== historyGenerationRef.current) return prev;
          const seen = new Set(prev.map((message) => message.id));
          return [...older.filter((message) => !seen.has(message.id)), ...prev];
        });
        const oldest = older[0];
        if (oldest) historyCursorRef.current = { created_at: oldest.created_at, id: oldest.id };
        const hasEarlier = older.length === INITIAL_MESSAGE_LIMIT;
        setHasEarlierMessages(hasEarlier);
        return { messageIds: older.map((message) => message.id), hasEarlier };
      } catch (err) {
        if (isCurrent()) {
          console.error("Failed to load earlier messages:", err);
          if (!signal) onSendError?.("Couldn't load earlier messages.");
        }
        return null;
      } finally {
        if (generation === historyGenerationRef.current) {
          earlierRequestRef.current = null;
          setIsLoadingEarlier(false);
        }
      }
    })();
    earlierRequestRef.current = { promise: request, signal };
    return request;
  }, [apartmentId, currentUserId, onSendError, otherUserId, supabase]);

  /**
   * Re-reads the current conversation and merges it into the rows already
   * held, so a resync (reconnect, refocus, failed reaction write) can't drop
   * realtime arrivals, optimistic sends or previously paged history.
   */
  const refreshMessages = useCallback(async () => {
    if (!otherUserId) return;
    const hydrated = await loadConversation(
      supabase,
      currentUserId,
      otherUserId,
      apartmentId ?? null
    );
    setMessages((prev) => reconcileMessages(prev, hydrated));
  }, [apartmentId, currentUserId, otherUserId, supabase]);

  /** Sends a text message, optionally as a reply. Optimistic with rollback. */
  const sendMessage = useCallback(
    async (content: string, replyToId: string | null) => {
      if (!otherUserId || !content.trim()) return;

      const text = content.trim();
      const tempId = `temp-${Date.now()}`;
      const preview: ReplyPreview | null = replyTarget
        ? toReplyPreview(replyTarget, currentUserId)
        : null;

      const pending: ChatMessage = {
        id: tempId,
        sender_id: currentUserId,
        receiver_id: otherUserId,
        message: text,
        message_type: "text",
        is_read: false,
        read_at: null,
        apartment_id: apartmentId ?? null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        reply_to: replyToId,
        replyTo: preview,
        reactions: [],
        isPending: true,
      };

      setMessages((prev) => [...prev, pending]);
      setReplyTarget(null);

      const { data, error } = await supabase
        .from("chat")
        .insert({
          sender_id: currentUserId,
          receiver_id: otherUserId,
          message: text,
          message_type: "text",
          apartment_id: apartmentId ?? null,
          reply_to: replyToId,
          is_read: false,
        })
        .select("id, message, message_type, created_at, sender_id, reply_to")
        .single();

      if (error || !data) {
        setMessages((prev) => prev.filter((m) => m.id !== tempId));
        console.error("Failed to send:", error?.message);
        onSendError?.(error?.message ?? "Failed to send");
        return;
      }

      setMessages((prev) => {
        // The realtime INSERT may have already landed the real row.
        const withoutPending = prev.filter((m) => m.id !== tempId);
        if (withoutPending.some((m) => m.id === data.id)) return withoutPending;
        const sent: ChatMessage = {
          ...pending,
          id: data.id,
          created_at: data.created_at,
          isPending: false,
        };
        return [...withoutPending, sent];
      });
    },
    [apartmentId, currentUserId, onSendError, otherUserId, replyTarget, supabase]
  );

  /**
   * Applies a reaction optimistically and persists it. Tapping the emoji the
   * current user already chose removes their reaction.
   */
  const toggleReaction = useCallback(
    async (messageId: string, emoji: string) => {
      const hadReaction = messages.some(
        (m) =>
          m.id === messageId &&
          m.reactions.some((r) => r.is_mine && r.emoji === emoji)
      );

      setMessages((prev) =>
        prev.map((m) => {
          if (m.id !== messageId) return m;
          if (hadReaction) {
            return { ...m, reactions: m.reactions.filter((r) => r.emoji !== emoji || !r.is_mine) };
          }
          return {
            ...m,
            // One reaction per user: drop the previous emoji, keep others'.
            reactions: [
              ...m.reactions.filter((r) => !r.is_mine),
              { emoji, user_id: currentUserId, is_mine: true },
            ],
          };
        })
      );

      try {
        await toggleChatReaction(supabase, {
          messageId,
          userId: currentUserId,
          emoji,
          hadReaction,
        });
      } catch (err) {
        console.error("Failed to save reaction:", err);
        // Re-sync from the server so the optimistic badge can't drift.
        void refreshMessages();
      }
    },
    [currentUserId, messages, refreshMessages, supabase]
  );

  /**
   * Unsends one of the current user's messages for everyone, like mobile:
   * removed optimistically (replies quoting it turn into "unavailable"), then
   * deleted, then broadcast to the other person's open mobile chat. Web peers
   * hear the database DELETE. A failed delete re-syncs from the server.
   */
  const unsendMessage = useCallback(
    async (messageId: string) => {
      const target = messages.find((m) => m.id === messageId);
      if (!target || !canUnsendMessage(target, currentUserId)) return;

      setMessages((prev) => removeMessage(prev, messageId));
      setReplyTarget((current) => (current?.id === messageId ? null : current));

      try {
        await deleteChatMessage(supabase, { message: target, senderId: currentUserId });
      } catch (err) {
        console.error("Unsend failed:", err);
        onSendError?.("Couldn't unsend that message. Please try again.");
        void refreshMessages();
        return;
      }

      void broadcastMessageDeleted(supabase, {
        messageId,
        senderId: currentUserId,
        receiverId: target.receiver_id,
        apartmentId: target.apartment_id,
      }).catch((err) => console.warn("Unsend broadcast failed (non-blocking):", err));
    },
    [currentUserId, messages, onSendError, refreshMessages, supabase]
  );

  /**
   * Uploads a staged attachment batch and writes the rows as one visual group.
   *
   * Optimistic like text send: every staged file becomes a pending bubble
   * showing its local preview immediately, then the upload + insert replaces
   * them in place. A failed upload removes only its own bubble.
   */
  const sendAttachments = useCallback(
    async (staged: StagedAttachment[]) => {
      if (!otherUserId || staged.length === 0) return;

      const groupId = generateAttachmentId();
      const replyToId = replyTarget?.id ?? null;
      const preview: ReplyPreview | null = replyTarget
        ? toReplyPreview(replyTarget, currentUserId)
        : null;
      const createdAt = new Date().toISOString();

      const pendingById = new Map<string, ChatMessage>();
      const optimistic: ChatMessage[] = staged.map((item) => {
        const tempId = `temp-${item.id}`;
        const row: ChatMessage = {
          id: tempId,
          sender_id: currentUserId,
          receiver_id: otherUserId,
          message: null,
          message_type: item.messageType,
          is_read: false,
          read_at: null,
          apartment_id: apartmentId ?? null,
          created_at: createdAt,
          updated_at: createdAt,
          reply_to: replyToId,
          replyTo: preview,
          reactions: [],
          isPending: true,
          attachment_path: null,
          attachment_url: null,
          attachment_mime_type: item.mimeType,
          attachment_name: item.file.name,
          attachment_size: item.file.size,
          group_id: groupId,
          resolvedUrl: item.previewUrl,
        };
        pendingById.set(tempId, row);
        return row;
      });

      setMessages((prev) => [...prev, ...optimistic]);
      setReplyTarget(null);

      const { uploaded, failures } = await uploadChatAttachments(
        supabase,
        currentUserId,
        staged.map((item) => item.file)
      );

      // The upload batch is bounded to one send, so staged items and uploaded
      // rows line up positionally; anything that failed is dropped by temp id.
      const inserted =
        uploaded.length > 0
          ? await supabase
              .from("chat")
              .insert(
                uploaded.map((item, index) => ({
                  sender_id: currentUserId,
                  receiver_id: otherUserId,
                  message: null,
                  message_type: item.messageType,
                  apartment_id: apartmentId ?? null,
                  reply_to: replyToId,
                  is_read: false,
                  attachment_path: item.path,
                  attachment_thumbnail_path: item.thumbnailPath,
                  attachment_mime_type: item.mimeType,
                  attachment_name: item.name,
                  attachment_size: item.size,
                  group_id: groupId,
                  // Only the first row keeps the quoted context, so a batch
                  // doesn't repeat the same quote on every bubble.
                  ...(index === 0 ? {} : { reply_to: null }),
                }))
              )
              .select(
                "id, message_type, created_at, attachment_path, attachment_thumbnail_path"
              )
          : { data: null, error: null };

      if (inserted.error) {
        console.error("Failed to send attachments:", inserted.error);
        onSendError?.("Couldn't send the attachments. Please try again.");
        // The rows were never created, so the uploads are now orphans.
        void supabase.storage
          .from("chat-images")
          .remove(uploaded.map((item) => item.path))
          .then(({ error: removeError }) => {
            if (removeError) console.error("Failed to clean up uploads:", removeError);
          });
      }

      const insertedRows: InsertedAttachmentRow[] = inserted.data ?? [];

      // `uploaded[i].index` points back at the staged item it came from, so a
      // partial batch still maps each confirmed row to the right bubble. Any
      // staged item with no confirmed row loses its optimistic bubble.
      const confirmedByTempId = new Map<string, InsertedAttachmentRow>();
      insertedRows.forEach((row, i) => {
        const stagedIndex = uploaded[i]?.index;
        const stagedItem =
          stagedIndex === undefined ? undefined : staged[stagedIndex];
        if (stagedItem) confirmedByTempId.set(`temp-${stagedItem.id}`, row);
      });

      setMessages((prev) =>
        prev.flatMap((m) => {
          const confirmed = confirmedByTempId.get(m.id);
          if (!confirmed?.attachment_path) {
            // Unconfirmed: the row may not exist, so the optimistic bubble goes.
            return m.id.startsWith("temp-") && pendingById.has(m.id) ? [] : [m];
          }
          return [
            {
              ...m,
              id: confirmed.id,
              created_at: confirmed.created_at,
              attachment_path: confirmed.attachment_path,
              attachment_thumbnail_path:
                confirmed.attachment_thumbnail_path ?? null,
              isPending: false,
            },
          ];
        })
      );

      // Resolve the just-written paths so the bubble swaps its local preview
      // for a signed URL without waiting for the next load.
      const insertedPaths = insertedRows
        .map((row) => row.attachment_path)
        .filter((path): path is string => Boolean(path));
      if (insertedPaths.length > 0) {
        const signed = await resolveAttachmentUrls(supabase, insertedPaths);
        if (signed.size > 0) {
          const byPath = new Map(signed);
          setMessages((prev) =>
            prev.map((m) => {
              if (!m.isPending && m.attachment_path) {
                const url = byPath.get(m.attachment_path);
                if (url) return { ...m, resolvedUrl: url };
              }
              return m;
            })
          );
        }
      }

      if (failures.length > 0) {
        const names = failures.map((f) => f.name).join(", ");
        onSendError?.(
          `Couldn't send ${failures.length === 1 ? "the file" : `${failures.length} files`}: ${names}.`
        );
      }
    },
    [apartmentId, currentUserId, onSendError, otherUserId, replyTarget, supabase]
  );

  /**
   * Sends a GIF by storing the CDN URL verbatim — never downloaded or
   * re-uploaded, matching mobile's `externalUrl` path.
   */
  const sendGif = useCallback(
    async (url: string) => {
      if (!otherUserId || !url) return;

      const tempId = `temp-${generateAttachmentId()}`;
      const replyToId = replyTarget?.id ?? null;
      const preview: ReplyPreview | null = replyTarget
        ? toReplyPreview(replyTarget, currentUserId)
        : null;
      const createdAt = new Date().toISOString();

      const pending: ChatMessage = {
        id: tempId,
        sender_id: currentUserId,
        receiver_id: otherUserId,
        message: null,
        message_type: "gif",
        is_read: false,
        read_at: null,
        apartment_id: apartmentId ?? null,
        created_at: createdAt,
        updated_at: createdAt,
        reply_to: replyToId,
        replyTo: preview,
        reactions: [],
        isPending: true,
        attachment_path: null,
        attachment_url: url,
        attachment_mime_type: "image/gif",
      };

      setMessages((prev) => [...prev, pending]);
      setReplyTarget(null);

      const { data, error } = await supabase
        .from("chat")
        .insert({
          sender_id: currentUserId,
          receiver_id: otherUserId,
          message: null,
          message_type: "gif",
          apartment_id: apartmentId ?? null,
          reply_to: replyToId,
          is_read: false,
          attachment_url: url,
          attachment_mime_type: "image/gif",
        })
        .select("id, created_at")
        .single();

      if (error || !data) {
        setMessages((prev) => prev.filter((m) => m.id !== tempId));
        console.error("Failed to send GIF:", error?.message);
        onSendError?.(error?.message ?? "Failed to send GIF");
        return;
      }

      setMessages((prev) =>
        prev.map((m) =>
          m.id === tempId
            ? { ...m, id: data.id, created_at: data.created_at, isPending: false }
            : m
        )
      );
    },
    [apartmentId, currentUserId, onSendError, otherUserId, replyTarget, supabase]
  );

  const handleReply = useCallback((msg: ChatMessage) => {
    if (msg.isPending || msg.id.startsWith("temp-")) return;
    setReplyTarget(msg);
  }, []);

  const clearReply = useCallback(() => setReplyTarget(null), []);

  const openContextMenu = useCallback((message: ChatMessage, position: { x: number; y: number }) => {
    setContextMenu({ message, position });
  }, []);

  const closeContextMenu = useCallback(() => setContextMenu(null), []);

  return {
    supabase,
    conversationId,
    messages,
    setMessages,
    isLoading,
    hasEarlierMessages,
    isLoadingEarlier,
    loadEarlierMessages,
    refreshMessages,
    replyTarget,
    contextMenu,
    sendMessage,
    sendAttachments,
    sendGif,
    toggleReaction,
    unsendMessage,
    handleReply,
    clearReply,
    openContextMenu,
    closeContextMenu,
  };
}
