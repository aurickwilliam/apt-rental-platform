"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ReadAcknowledgementQueue } from "@/lib/read-acknowledgement-queue";

/** Acknowledgment work survives optimistic feed renders, but not resource/account
 * retirement. Two attempts per viewing trigger, then retry on refocus/online. */
export function useNotificationReadRetry(scopeKey: string | null, ids: string[], markRead: (ids: string[]) => Promise<boolean>) {
  const queueRef = useRef<ReadAcknowledgementQueue<void> | null>(null);
  const idsRef = useRef(ids);
  const [failure, setFailure] = useState<{ key: string; message: string } | null>(null);
  useEffect(() => { idsRef.current = ids; }, [ids]);
  useEffect(() => {
    if (!scopeKey) return;
    const queue = new ReadAcknowledgementQueue<void>({
      visible: () => document.visibilityState === "visible",
      read: async selected => { if (!await markRead(selected)) throw new Error("Notification read not confirmed."); },
      confirmed: () => setFailure(null),
      failed: () => setFailure({ key: scopeKey, message: "Some notification read updates couldn't be saved. Retry or return to this page to reconcile." }),
    });
    queueRef.current = queue;
    const resume = () => { if (document.visibilityState === "visible") { queue.observe(idsRef.current); queue.resume(); } };
    window.addEventListener("focus", resume);
    window.addEventListener("online", resume);
    document.addEventListener("visibilitychange", resume);
    queue.observe(idsRef.current);
    return () => {
      queue.dispose();
      if (queueRef.current === queue) queueRef.current = null;
      window.removeEventListener("focus", resume);
      window.removeEventListener("online", resume);
      document.removeEventListener("visibilitychange", resume);
    };
  }, [markRead, scopeKey]);
  useEffect(() => { queueRef.current?.observe(ids); }, [ids]);
  const retry = useCallback(() => { queueRef.current?.observe(idsRef.current); queueRef.current?.resume(); }, []);
  return { error: failure?.key === scopeKey ? failure.message : null, retry };
}
