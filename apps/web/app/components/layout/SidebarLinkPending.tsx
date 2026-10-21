"use client";

import { useLinkStatus } from "next/link";

/** Next owns completion, interrupted navigations and failed transitions. */
export default function SidebarLinkPending({ label }: { label: string }) {
  const { pending } = useLinkStatus();
  if (!pending) return null;
  return (
    <span role="status" data-navigation-pending="true">
      <span className="sr-only">Opening {label}…</span>
      <span aria-hidden="true" className="pointer-events-none absolute inset-x-3 bottom-1 h-0.5 rounded-full bg-current motion-safe:animate-pulse" />
    </span>
  );
}
