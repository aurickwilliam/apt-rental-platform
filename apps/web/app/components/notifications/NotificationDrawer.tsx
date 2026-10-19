"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { Button, Drawer, Skeleton, useOverlayState } from "@heroui/react";
import { IconBell, IconX } from "@tabler/icons-react";

import { useNotifications } from "@/hooks/use-notifications";
import type { ActivePortal } from "@/lib/notification-audience";
import { clearFabPlacement, isDefaultFabPlacement, loadFabPlacement } from "@/lib/notification-fab-position";
import { resolveNotificationHref } from "@/lib/notification-links";
import type { FeedNotification } from "@/service/notificationService";

import { FAB_PLACEMENT_RESET_EVENT } from "./DraggableNotificationBell";
import NotificationRow from "./NotificationRow";

type Filter = "all" | "unread";

interface DateGroup {
  key: string;
  label: string;
  items: FeedNotification[];
}

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

function startOfDay(date: Date): Date {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

/** Today / Yesterday / calendar-date buckets, newest group first. */
function groupByDate(notifications: FeedNotification[]): DateGroup[] {
  const today = startOfDay(new Date());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const buckets = new Map<string, DateGroup>();
  for (const n of notifications) {
    const day = startOfDay(new Date(n.created_at));
    const diffDays = Math.round(
      (today.getTime() - day.getTime()) / (24 * 60 * 60 * 1000),
    );
    const key =
      diffDays <= 0 ? "today" : diffDays === 1 ? "yesterday" : day.toISOString();
    const label =
      diffDays <= 0
        ? "Today"
        : diffDays === 1
          ? "Yesterday"
          : day.toLocaleDateString(undefined, {
              month: "short",
              day: "numeric",
              year: day.getFullYear() === today.getFullYear() ? undefined : "numeric",
            });
    const group = buckets.get(key) ?? { key, label, items: [] };
    group.items.push(n);
    buckets.set(key, group);
  }
  return [...buckets.values()].sort((a, b) => (a.key < b.key ? 1 : -1));
}

/**
 * Right-side notifications drawer. Data is portal-scoped by the hook;
 * opening a row marks it read (fire-and-forget) and follows the resolved
 * portal route, or stays put when the payload has no destination here.
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
  const [filter, setFilter] = useState<Filter>("all");
  const { notifications, unreadCount, loading, error, markOneRead, markVisibleRead } =
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

  const shown = useMemo(
    () => (filter === "unread" ? notifications.filter((n) => !n.is_read) : notifications),
    [filter, notifications],
  );
  const groups = useMemo(() => groupByDate(shown), [shown]);

  const openNotification = (notification: FeedNotification) => {
    void markOneRead(notification.id);
    const href = resolveNotificationHref(notification.data, activePortal);
    if (href) {
      onClose();
      router.push(href);
    }
  };

  return (
    <Drawer.Root state={drawerState}>
      <Drawer.Backdrop>
        <Drawer.Content placement="right">
          <Drawer.Dialog
            aria-label="Notifications"
            className="flex h-full w-[calc(100vw-2rem)] max-w-sm flex-col rounded-l-3xl p-0"
          >
            <div className="flex items-center gap-2 border-b border-divider px-4 py-3">
              <h2 className="flex items-center gap-2 font-nunito text-lg font-bold text-foreground">
                <IconBell size={20} className="text-primary" aria-hidden="true" />
                Notifications
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
                aria-label="Close notifications"
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
                  {value === "all" ? "All" : "Unread"}
                </button>
              ))}
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={() => void markVisibleRead()}
                  className="ml-auto cursor-pointer font-nunito text-sm font-semibold text-primary hover:underline focus-visible:outline-2 focus-visible:outline-primary"
                >
                  Mark all read
                </button>
              )}
            </div>

            <Drawer.Body className="min-h-0 flex-1 overflow-y-auto p-3">
              {loading ? (
                <div className="flex flex-col gap-2" aria-label="Loading notifications">
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
                    ? "You're all caught up."
                    : "No notifications yet."}
                </p>
              ) : (
                groups.map((group) => (
                  <section key={group.key} aria-label={group.label} className="mb-2">
                    <h3 className="px-3 pb-1 pt-2 font-nunito text-xs font-bold uppercase tracking-wide text-muted-foreground">
                      {group.label}
                    </h3>
                    <div className="flex flex-col gap-1">
                      {group.items.map((n) => (
                        <NotificationRow
                          key={n.id}
                          notification={n}
                          onOpen={() => openNotification(n)}
                        />
                      ))}
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
                  Reset bell position
                </button>
              </div>
            ) : null}
          </Drawer.Dialog>
        </Drawer.Content>
      </Drawer.Backdrop>
    </Drawer.Root>
  );
}
