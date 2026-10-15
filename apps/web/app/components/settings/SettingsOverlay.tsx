"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import SettingsModal from "./SettingsModal";
import ChangePasswordModal from "./ChangePasswordModal";
import ChangeEmailModal from "./ChangeEmailModal";

export const SETTINGS_QUERY_VALUE = "open";

export default function SettingsOverlay({
  initialRoles,
  activePortal,
}: {
  /** Server-known account roles; seeds tab visibility on first paint. */
  initialRoles?: string[];
  /** Portal this Settings instance belongs to; mirrors `AppSidebar activePortal`. */
  activePortal?: "tenant" | "landlord" | "admin";
}) {
  const searchParams = useSearchParams();
  const open = searchParams.get("settings") === SETTINGS_QUERY_VALUE;
  // Stay mounted after the first open so reopening is instant and the
  // dialog can play its exit animation instead of being torn down.
  const [hasOpened, setHasOpened] = useState(open);
  if (open && !hasOpened) setHasOpened(true);
  // Change Password and Change Email have their own modals; Settings closes
  // before either opens.
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);
  const [changeEmailOpen, setChangeEmailOpen] = useState(false);

  if (!hasOpened) return null;

  // History API (synced by Next) keeps the URL shareable without a server
  // round trip re-running the layout and page data on every open/close.
  const close = () => {
    const url = new URL(window.location.href);
    url.searchParams.delete("settings");
    window.history.replaceState(null, "", `${url.pathname}${url.search}${url.hash}`);
  };

  const openChangePassword = () => {
    close();
    setChangePasswordOpen(true);
  };

  const openChangeEmail = () => {
    close();
    setChangeEmailOpen(true);
  };

  return (
    <>
      <SettingsModal
        open={open}
        onClose={close}
        initialRoles={initialRoles}
        activePortal={activePortal}
        onChangePassword={openChangePassword}
        onChangeEmail={openChangeEmail}
      />
      <ChangePasswordModal isOpen={changePasswordOpen} onOpenChange={setChangePasswordOpen} />
      <ChangeEmailModal isOpen={changeEmailOpen} onOpenChange={setChangeEmailOpen} />
    </>
  );
}
