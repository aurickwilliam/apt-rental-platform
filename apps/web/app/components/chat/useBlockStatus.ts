"use client";

import { useCallback, useEffect, useMemo } from "react";
import { createClient } from "@repo/supabase/browser";

import { useAsyncResource } from "@/hooks/use-async-resource";
import { getBlockStatus, type BlockStatus } from "./conversationActions";

const NOT_BLOCKED: BlockStatus = { blockedByMe: false, blockedMe: false };

/**
 * Whether messaging with `otherUserId` is blocked, in either direction (mobile's
 * `useBlockStatus`). The database refuses new messages either way; this only
 * drives the composer. Call `revalidate` after a refused send so a block made
 * while the thread is open takes effect without a reload.
 */
export default function useBlockStatus(otherUserId: string | null) {
  const supabase = useMemo(() => createClient(), []);
  const load = useCallback(
    () => (otherUserId ? getBlockStatus(supabase, otherUserId) : Promise.resolve(NOT_BLOCKED)),
    [supabase, otherUserId]
  );
  const { data, loading, error, revalidate } = useAsyncResource(load, NOT_BLOCKED, "Unable to load block status");
  // A block can start while the thread is open, so check again on return.
  useEffect(() => {
    if (!otherUserId) return;
    const onFocus = () => void revalidate();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [otherUserId, revalidate]);

  // useAsyncResource keeps the previous result while loading; never carry one
  // contact's block over to another.
  const status = loading || error ? NOT_BLOCKED : data;
  return { ...status, revalidate };
}
