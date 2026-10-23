"use client";

import { useEffect, type RefObject } from "react";

/** How long a freshly opened thread stays pinned to the bottom while its media sizes itself. */
export const OPEN_PIN_WINDOW_MS = 2000;

interface ScrollToLatestOptions {
  scrollRef: RefObject<HTMLDivElement | null>;
  /** Re-arms "follow the newest message" for the thread's own scroll logic. */
  nearBottomRef: RefObject<boolean>;
  /** Changes whenever another conversation is opened. */
  conversationKey: string | null;
  isLoading: boolean;
}

/**
 * Opens every conversation at its newest message. Without this, a thread opened
 * after the reader had scrolled up in the previous one kept its "not near the
 * bottom" state and stayed wherever it landed. Once the messages have loaded the
 * thread jumps to the bottom, then stays pinned there while photos and GIFs size
 * themselves — until the reader scrolls, or for {@link OPEN_PIN_WINDOW_MS}.
 */
export default function useScrollToLatestOnOpen({ scrollRef, nearBottomRef, conversationKey, isLoading }: ScrollToLatestOptions) {
  useEffect(() => {
    const scroller = scrollRef.current;
    if (!conversationKey || isLoading || !scroller) return;

    const toBottom = () => {
      scroller.scrollTop = scroller.scrollHeight;
    };
    toBottom();
    nearBottomRef.current = true;

    let pinned = true;
    const release = () => {
      pinned = false;
    };
    const timeline = scroller.querySelector("[data-message-timeline]");
    const observer = timeline ? new ResizeObserver(() => { if (pinned) toBottom(); }) : null;
    if (timeline) observer?.observe(timeline);
    const timer = setTimeout(release, OPEN_PIN_WINDOW_MS);
    scroller.addEventListener("wheel", release, { passive: true });
    scroller.addEventListener("touchmove", release, { passive: true });
    scroller.addEventListener("keydown", release);

    return () => {
      clearTimeout(timer);
      observer?.disconnect();
      scroller.removeEventListener("wheel", release);
      scroller.removeEventListener("touchmove", release);
      scroller.removeEventListener("keydown", release);
    };
  }, [conversationKey, isLoading, nearBottomRef, scrollRef]);
}
