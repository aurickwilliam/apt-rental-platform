"use client";

import { IconBell } from "@tabler/icons-react";

import { NOTIFICATIONS_QUERY_VALUE } from "@/app/components/notifications/NotificationsOverlay";
import { useTranslation } from "@/app/components/i18n/LocaleProvider";
import { useNotificationDisplayPreferences } from "@/hooks/use-notification-display-preferences";
import { useNotifications } from "@/hooks/use-notifications";
import type { ActivePortal } from "@/lib/notification-audience";
import { Button, Tooltip } from "@heroui/react";

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
  const { t } = useTranslation();

  if (preferences.entry !== "sidebar") return null;

  const hasUnread = unreadCount > 0;
  const openDrawer = () => {
    const url = new URL(window.location.href);
    url.searchParams.set("notifications", NOTIFICATIONS_QUERY_VALUE);
    window.history.pushState(null, "", `${url.pathname}${url.search}${url.hash}`);
  };

  return (
    <Tooltip isDisabled={!collapsed}>
      <Tooltip.Trigger>
        <Button
          variant="ghost"
          onClick={openDrawer}
          aria-haspopup="dialog"
          aria-label={hasUnread ? t("nav.notificationsUnread", { count: unreadCount }) : collapsed ? t("nav.notifications") : undefined}
          className={`button--bare group relative flex min-h-11 w-full cursor-pointer items-center rounded-xl text-sm font-semibold text-sidebar-foreground/70 transition-all hover:bg-primary/10 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring ${collapsed ? "justify-center" : "justify-start gap-3 py-2.5 pl-3 pr-7"}`}
        >
          <IconBell
            size={collapsed ? 22 : 20}
            aria-hidden="true"
            className="shrink-0 text-sidebar-foreground/60 group-hover:text-primary"
          />
          {!collapsed ? <span>{t("nav.notifications")}</span> : null}
          {hasUnread ? (
            <span
              aria-hidden="true"
              className={`pointer-events-none absolute flex items-center justify-center rounded-full bg-danger font-bold text-white ${collapsed ? "right-0 top-0 min-h-4 min-w-4 px-0.5 text-[10px]" : "right-3 top-1/2 min-h-5 min-w-5 -translate-y-1/2 px-1 text-[11px]"}`}
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          ) : null}
        </Button>
      </Tooltip.Trigger>
      <Tooltip.Content placement="right">
        {hasUnread ? t("nav.notificationsUnread", { count: unreadCount }) : t("nav.notifications")}
      </Tooltip.Content>
    </Tooltip>
  );
}
