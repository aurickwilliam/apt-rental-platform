import type { EarlierMessagesPage } from "./useConversation";

/** At most 500 older rows with the existing 100-row history pages. */
export const MAX_REPLY_LOOKUP_PAGES = 5;
export const REPLY_LOOKUP_TIMEOUT_MS = 30_000;
export const REPLY_HIGHLIGHT_MS = 1_800;

export type ReplyLookupResult = "found" | "unavailable" | "limit" | "error" | "cancelled";

/** Cancellation also stops waiting on media signing, which has no abort API. */
export function waitForReplyWork<T>(work: Promise<T>, signal: AbortSignal): Promise<T | null> {
  return new Promise((resolve, reject) => {
    const cancel = () => { resolve(null); };
    if (signal.aborted) resolve(null);
    else signal.addEventListener("abort", cancel, { once: true });
    work.then((value) => { signal.removeEventListener("abort", cancel); resolve(value); },
      (error: unknown) => { signal.removeEventListener("abort", cancel); reject(error); });
  });
}

interface ReplyLookupOptions {
  signal: AbortSignal;
  findTarget: () => boolean;
  hasEarlier: () => boolean;
  loadEarlier: (signal: AbortSignal) => Promise<EarlierMessagesPage | null>;
}

/** Navigation only: all reads stay in the existing authorized history loader. */
export async function locateReplyMessage({ signal, findTarget, hasEarlier, loadEarlier }: ReplyLookupOptions): Promise<ReplyLookupResult> {
  if (signal.aborted) return "cancelled";
  if (findTarget()) return "found";
  let canLoad = hasEarlier();
  for (let page = 0; page < MAX_REPLY_LOOKUP_PAGES && canLoad; page++) {
    const result = await loadEarlier(signal);
    if (signal.aborted) return "cancelled";
    if (!result) return "error";
    if (findTarget()) return "found";
    canLoad = result.hasEarlier;
    if (result.messageIds.length === 0) return "unavailable";
  }
  return canLoad ? "limit" : "unavailable";
}

export function findReplyTarget(container: HTMLElement, messageId: string): HTMLElement | null {
  return Array.from(container.querySelectorAll<HTMLElement>("[data-chat-message-id]"))
    .find((element) => element.dataset.chatMessageId === messageId) ?? null;
}

export function centerReplyTarget(container: HTMLElement, target: HTMLElement, reducedMotion: boolean) {
  const rect = target.getBoundingClientRect();
  const top = container.scrollTop + rect.top - container.getBoundingClientRect().top
    - (container.clientHeight - rect.height) / 2;
  container.scrollTo({ top: Math.max(0, Math.min(top, container.scrollHeight - container.clientHeight)), behavior: reducedMotion ? "auto" : "smooth" });
  target.focus({ preventScroll: true });
}
