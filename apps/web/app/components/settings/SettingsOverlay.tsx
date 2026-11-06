"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";
import { requestTutorialReplay } from "@/lib/tutorial-controller";

const SettingsModal = dynamic(() => import("./SettingsModal"), {
  loading: () => <span role="status" className="sr-only">Opening settings…</span>,
});
const ChangePasswordModal = dynamic(() => import("./ChangePasswordModal"));
const ChangeEmailModal = dynamic(() => import("./ChangeEmailModal"));

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
  // Deep-link intent for the tenant tab, cleared with the dialog below.
  const requestedRental = searchParams.get("settingsTab") === "rental";
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
    url.searchParams.delete("settingsTab");
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

  // Settings closes first; the tour then starts over the portal page.
  const startTutorial = (portal: "tenant" | "landlord") => {
    close();
    requestTutorialReplay(portal);
  };

  return (
    <>
      <SettingsModal
        open={open}
        onClose={close}
        initialRoles={initialRoles}
        activePortal={activePortal}
        requestedRental={requestedRental}
        onChangePassword={openChangePassword}
        onChangeEmail={openChangeEmail}
        onStartTutorial={startTutorial}
      />
      <ChangePasswordModal isOpen={changePasswordOpen} onOpenChange={setChangePasswordOpen} />
      <ChangeEmailModal isOpen={changeEmailOpen} onOpenChange={setChangeEmailOpen} />
    </>
  );
}
