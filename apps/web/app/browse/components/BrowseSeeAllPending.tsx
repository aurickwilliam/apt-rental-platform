"use client";

import { useLinkStatus } from "next/link";

/** Next owns cancellation/completion; loaded cards never depend on this status. */
export default function BrowseSeeAllPending() {
  const { pending } = useLinkStatus();
  return pending ? <span role="status" className="ml-1 text-xs text-muted-foreground">Opening…</span> : null;
}
