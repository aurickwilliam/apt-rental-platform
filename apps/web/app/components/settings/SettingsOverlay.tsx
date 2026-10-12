"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import SettingsModal from "./SettingsModal";

export const SETTINGS_QUERY_VALUE = "open";

export default function SettingsOverlay() {
  const searchParams = useSearchParams();
  const open = searchParams.get("settings") === SETTINGS_QUERY_VALUE;
  // Stay mounted after the first open so reopening is instant and the
  // dialog can play its exit animation instead of being torn down.
  const [hasOpened, setHasOpened] = useState(open);
  if (open && !hasOpened) setHasOpened(true);

  if (!hasOpened) return null;

  // History API (synced by Next) keeps the URL shareable without a server
  // round trip re-running the layout and page data on every open/close.
  const close = () => {
    const url = new URL(window.location.href);
    url.searchParams.delete("settings");
    window.history.replaceState(null, "", `${url.pathname}${url.search}${url.hash}`);
  };

  return <SettingsModal open={open} onClose={close} />;
}
