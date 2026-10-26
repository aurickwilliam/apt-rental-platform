"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";

import { useTranslation } from "@/app/components/i18n/LocaleProvider";
import type { ActivePortal } from "@/lib/notification-audience";

/** Spoken placeholder while the drawer's chunk loads. */
function OpeningNotifications() {
  const { t } = useTranslation();
  return (
    <span role="status" className="sr-only">
      {t("notifications.opening")}
    </span>
  );
}

const NotificationDrawer = dynamic(() => import("./NotificationDrawer"), {
  loading: () => <OpeningNotifications />,
});

export const NOTIFICATIONS_QUERY_VALUE = "open";

/**
 * Portal notification overlay. Mounted once per portal layout (inside
 * Suspense, like SettingsOverlay): opening is driven by the shared
 * `?notifications=` query param, so the sidebar bell and the mobile menu
 * entry need no shared component state. Stays mounted after the first open
 * for instant reopening.
 */
export default function NotificationsOverlay({
  activePortal,
}: {
  /** Portal whose notifications are shown; mirrors `AppSidebar activePortal`. */
  activePortal: ActivePortal;
}) {
  const searchParams = useSearchParams();
  const open = searchParams.get("notifications") === NOTIFICATIONS_QUERY_VALUE;
  const [hasOpened, setHasOpened] = useState(open);
  if (open && !hasOpened) setHasOpened(true);

  if (!hasOpened) return null;

  const close = () => {
    const url = new URL(window.location.href);
    url.searchParams.delete("notifications");
    window.history.replaceState(null, "", `${url.pathname}${url.search}${url.hash}`);
  };

  return (
    <NotificationDrawer activePortal={activePortal} open={open} onClose={close} />
  );
}
