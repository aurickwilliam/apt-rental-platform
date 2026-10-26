"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { Button, Drawer, Skeleton, useOverlayState } from "@heroui/react";
import { IconBell, IconX } from "@tabler/icons-react";
import {
  groupNotificationFeed,
  groupNotificationsByLocalDate,
  type MessageGroupUnit,
} from "@repo/utils";

import { useTranslation } from "@/app/components/i18n/LocaleProvider";
import { useNotificationDisplayPreferences } from "@/hooks/use-notification-display-preferences";
import { useNotifications } from "@/hooks/use-notifications";
import type { ActivePortal } from "@/lib/notification-audience";
import { clearFabPlacement, isDefaultFabPlacement, loadFabPlacement } from "@/lib/notification-fab-position";
import { getLocalCalendarDay, subscribeLocalCalendarDay } from "@/lib/notification-calendar";
import { resolveNotificationTarget } from "@/lib/notification-links";
import type { FeedNotification } from "@/service/notificationService";

import { FAB_PLACEMENT_RESET_EVENT } from "./DraggableNotificationBell";
import NotificationGroupRow from "./NotificationGroupRow";
import NotificationRow from "./NotificationRow";

type Filter = "all" | "unread";

/** Browser-only flag for the reset row: re-read on every render the drawer
 *  is open, refreshed by storage/reset events (repo external-store pattern). */
function subscribePlacementFlag(onChange: () => void): () => void {
  window.addEventListener("storage", onChange);
  window.addEventListener(FAB_PLACEMENT_RESET_EVENT, onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(FAB_PLACEMENT_RESET_EVENT, onChange);
  };
}

function readHasCustomPlacement(): boolean {
  return !isDefaultFabPlacement(loadFabPlacement(window.localStorage));
}

/**
 * Side notifications drawer (right by default, left when Settings says so). Data is portal-scoped by the hook;
 * opening a row marks it read (fire-and-forget) and follows the resolved
 * portal route, or stays put when the payload has no destination here.
 * Consecutive chat messages from one sender render as one group summary;
 * expanding it is presentation-only and never changes read state.
 */
export default function NotificationDrawer({
  activePortal,
  open,
  onClose,
}: {
  activePortal: ActivePortal;
  open: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const { language, t } = useTranslation();
  const { preferences: displayPreferences } = useNotificationDisplayPreferences();
  const side = displayPreferences.drawerSide;
  const [filter, setFilter] = useState<Filter>("all");
  // Keyed by group identity (conversation + sender + oldest member), so a
  // realtime arrival keeps an already-expanded group open.
  const [expandedGroups, setExpandedGroups] = useState<ReadonlySet<string>>(
    () => new Set(),
  );
  // Portal-local presentation state must not leak across a reused drawer.
  // The account feed remains shared; only local controls are reset.
  const [previousPortal, setPreviousPortal] = useState(activePortal);
  if (previousPortal !== activePortal) {
    setPreviousPortal(activePortal);
    setExpandedGroups(new Set());
    setFilter("all");
  }
  const { notifications, unreadCount, loading, error, markOneRead, markManyRead, markVisibleRead } =
    useNotifications(activePortal);

  // Keyboard-accessible bell-position reset (the bell itself also resets on
  // double-click). External store per repo convention — no effects.
  const hasCustomPlacement = useSyncExternalStore(
    subscribePlacementFlag,
    readHasCustomPlacement,
    () => false,
  );

  const resetBellPosition = () => {
    clearFabPlacement(window.localStorage);
    window.dispatchEvent(new Event(FAB_PLACEMENT_RESET_EVENT));
    onClose();
  };

  const drawerState = useOverlayState({
    isOpen: open,
    onOpenChange: (value) => {
      if (!value) onClose();
    },
  });

  const units = useMemo(() => groupNotificationFeed(notifications), [notifications]);
  const shown = useMemo(
    () =>
      filter === "unread"
        ? units.filter((unit) =>
            unit.kind === "single" ? !unit.notification.is_read : unit.hasUnread,
          )
        : units,
    [filter, units],
  );
  const localDay = useSyncExternalStore(
    subscribeLocalCalendarDay,
    getLocalCalendarDay,
    () => 0,
  );
  const groups = useMemo(
    () => groupNotificationsByLocalDate(shown, new Date(localDay), language),
    [shown, localDay, language],
  );

  const toggleGroup = (key: string) => {
    setExpandedGroups((previous) => {
      const next = new Set(previous);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  // Single rows keep their existing behavior: acknowledge, then follow the
  // resolved route when the payload addresses one.
  const openNotification = (notification: FeedNotification) => {
    void markOneRead(notification.id);
    const { href } = resolveNotificationTarget(notification.data, activePortal);
    if (href) {
      onClose();
      router.push(href);
    }
  };

  // A group acknowledges its unread records in one batch, but only when the
  // payload addressed the actual conversation: the inbox fallback must never
  // clear rows the user never got to see. The drawer cannot observe whether
  // the message page then selected the thread, so an unknown key (which
  // degrades to the page default) is acknowledged optimistically.
  const openGroup = (unit: MessageGroupUnit<FeedNotification>) => {
    const target = resolveNotificationTarget(unit.latest.data, activePortal);
    if (target.conversationTargeted) {
      void markManyRead(
        unit.members.filter((member) => !member.is_read).map((member) => member.id),
      );
    }
    if (target.href) {
      onClose();
      router.push(target.href);
    }
  };

  return (
    <Drawer.Root state={drawerState}>
      <Drawer.Backdrop>
        <Drawer.Content placement={side}>
          <Drawer.Dialog
            aria-label={t("notifications.title")}
            className={`apt-notifications-drawer flex h-full w-[calc(100vw-2rem)] max-w-sm flex-col p-0 ${side === "left" ? "rounded-r-3xl" : "rounded-l-3xl"}`}
          >
            <div className="flex items-center gap-2 border-b border-divider px-4 py-3">
              <h2 className="flex items-center gap-2 font-nunito text-lg font-bold text-foreground">
                <IconBell size={20} className="text-primary" aria-hidden="true" />
                {t("notifications.title")}
                {unreadCount > 0 && (
                  <span className="flex min-h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[11px] font-bold text-white">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </h2>
              <Button
                type="button"
                isIconOnly
                variant="ghost"
                size="sm"
                onPress={onClose}
                aria-label={t("notifications.close")}
                className="ml-auto"
              >
                <IconX size={16} aria-hidden="true" />
              </Button>
            </div>

            <div className="flex items-center gap-1 border-b border-divider px-4 py-2">
              {(["all", "unread"] as const).map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setFilter(value)}
                  aria-pressed={filter === value}
                  className={`cursor-pointer rounded-full px-3 py-1.5 font-nunito text-sm font-semibold focus-visible:outline-2 focus-visible:outline-primary ${
                    filter === value
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-primary/5 hover:text-primary"
                  }`}
                >
                  {value === "all"
                    ? t("common.all")
                    : t("notifications.filter.unread")}
                </button>
              ))}
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={() => void markVisibleRead()}
                  className="ml-auto cursor-pointer font-nunito text-sm font-semibold text-primary hover:underline focus-visible:outline-2 focus-visible:outline-primary"
                >
                  {t("notifications.markAllVisible")}
                </button>
              )}
            </div>

            <Drawer.Body className="min-h-0 flex-1 overflow-y-auto p-3">
              {loading ? (
                <div
                  className="flex flex-col gap-2"
                  aria-label={t("notifications.loading")}
                >
                  {Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} className="h-16 w-full rounded-2xl" />
                  ))}
                </div>
              ) : error ? (
                <p role="alert" className="mt-10 px-4 text-center font-inter text-sm text-danger">
                  {error}
                </p>
              ) : shown.length === 0 ? (
                <p className="mt-10 px-4 text-center font-inter text-sm text-muted-foreground">
                  {filter === "unread"
                    ? t("notifications.caughtUp")
                    : t("notifications.empty")}
                </p>
              ) : (
                groups.map((group) => (
                  <section key={group.key} aria-label={group.label} className="mb-2">
                    <h3 className="px-3 pb-1 pt-2 font-nunito text-xs font-bold uppercase tracking-wide text-muted-foreground">
                      {group.label}
                    </h3>
                    <div className="flex flex-col gap-1">
                      {group.items.map((unit) =>
                        unit.kind === "single" ? (
                          <NotificationRow
                            key={unit.id}
                            notification={unit.notification}
                            language={language}
                            onOpen={() => openNotification(unit.notification)}
                          />
                        ) : (
                          <NotificationGroupRow
                            key={unit.key}
                            unit={unit}
                            language={language}
                            expanded={expandedGroups.has(unit.key)}
                            onToggle={() => toggleGroup(unit.key)}
                            onOpenGroup={() => openGroup(unit)}
                            onOpenMember={openNotification}
                          />
                        ),
                      )}
                    </div>
                  </section>
                ))
              )}
            </Drawer.Body>
            {hasCustomPlacement ? (
              <div className="flex justify-center border-t border-divider px-4 py-2">
                <button
                  type="button"
                  onClick={resetBellPosition}
                  className="cursor-pointer font-nunito text-xs font-semibold text-muted-foreground hover:text-primary hover:underline focus-visible:outline-2 focus-visible:outline-primary"
                >
                  {t("notifications.resetBellPosition")}
                </button>
              </div>
            ) : null}
          </Drawer.Dialog>
        </Drawer.Content>
      </Drawer.Backdrop>
    </Drawer.Root>
  );
}
