"use client";

import { useLinkStatus } from "next/link";

/** Next owns completion, interrupted navigations and failed transitions. */
export default function SidebarLinkPending({ label }: { label: string }) {
  const { pending } = useLinkStatus();
  if (!pending) return null;
  return (
    <span role="status" data-navigation-pending="true">
      <span className="sr-only">Opening {label}…</span>
    </span>
  );
}
