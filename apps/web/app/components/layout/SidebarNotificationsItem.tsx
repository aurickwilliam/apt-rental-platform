"use client";

import { IconBell } from "@tabler/icons-react";

import { NOTIFICATIONS_QUERY_VALUE } from "@/app/components/notifications/NotificationsOverlay";
import { useNotificationDisplayPreferences } from "@/hooks/use-notification-display-preferences";
import { useNotifications } from "@/hooks/use-notifications";
import type { ActivePortal } from "@/lib/notification-audience";

/**
 * Sidebar entry that opens the notifications drawer. Rendered only when the
 * user picked "Sidebar tab" in Settings (the floating bell is hidden then).
 * Opens through the shared `?notifications=` query param, like Settings, so it
 * is never a route and never the "current page".
 */
export default function SidebarNotificationsItem({
  activePortal,
  collapsed,
}: {
  activePortal?: ActivePortal;
  collapsed: boolean;
}) {
  const { preferences } = useNotificationDisplayPreferences();
  const { unreadCount } = useNotifications(activePortal ?? null);

  if (preferences.entry !== "sidebar") return null;

  const hasUnread = unreadCount > 0;
  const openDrawer = () => {
    const url = new URL(window.location.href);
    url.searchParams.set("notifications", NOTIFICATIONS_QUERY_VALUE);
    window.history.pushState(null, "", `${url.pathname}${url.search}${url.hash}`);
  };

  return (
    <button
      type="button"
      onClick={openDrawer}
      aria-haspopup="dialog"
      aria-label={hasUnread ? "Notifications, Unread activity" : collapsed ? "Notifications" : undefined}
      title={collapsed ? `Notifications${hasUnread ? ", Unread activity" : ""}` : undefined}
      className={`group relative flex min-h-11 w-full cursor-pointer items-center rounded-xl text-sm font-semibold text-sidebar-foreground/70 transition-all hover:bg-primary/10 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring ${collapsed ? "justify-center" : "gap-3 py-2.5 pl-3 pr-7"}`}
    >
      <IconBell
        size={collapsed ? 22 : 20}
        aria-hidden="true"
        className="shrink-0 text-sidebar-foreground/60 group-hover:text-primary"
      />
      {!collapsed ? <span>Notifications</span> : null}
      {hasUnread ? (
        <span
          aria-hidden="true"
          className={`pointer-events-none absolute size-2 rounded-full bg-primary ${collapsed ? "right-0.5 top-0.5" : "right-3 top-1/2 -translate-y-1/2"}`}
        />
      ) : null}
    </button>
  );
}
