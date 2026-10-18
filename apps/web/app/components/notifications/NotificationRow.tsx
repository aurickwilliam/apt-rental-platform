"use client";

import {
  IconCreditCard,
  IconHome,
  IconMessageCircle,
  IconSettings,
  IconTool,
} from "@tabler/icons-react";
import { getNotificationPreview, getRelativeTime } from "@repo/utils";

import { composeNotificationRowLabel } from "@/lib/notification-row";
import type { FeedNotification } from "@/service/notificationService";

const TYPE_ICONS: Record<string, React.ReactNode> = {
  payment: <IconCreditCard size={20} aria-hidden="true" />,
  message: <IconMessageCircle size={20} aria-hidden="true" />,
  maintenance: <IconTool size={20} aria-hidden="true" />,
  apartment: <IconHome size={20} aria-hidden="true" />,
  system: <IconSettings size={20} aria-hidden="true" />,
};

/**
 * One feed row: type icon, title, description, relative time, unread dot.
 * The whole row is the tap target; the caller marks it read and navigates.
 */
export default function NotificationRow({
  notification,
  onOpen,
}: {
  notification: FeedNotification;
  onOpen: () => void;
}) {
  // Reaction rows carry a short, server-truncated preview; other producers omit it.
  const preview = getNotificationPreview(notification.data);
  const accessibleLabel = composeNotificationRowLabel({
    title: notification.title,
    message: notification.message,
    preview,
    isRead: notification.is_read,
  });

  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label={accessibleLabel}
      className="flex w-full cursor-pointer items-start gap-3 rounded-2xl px-3 py-3 text-left transition-colors hover:bg-primary/5 focus-visible:outline-2 focus-visible:outline-primary"
    >
      <span
        aria-hidden="true"
        className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary"
      >
        {TYPE_ICONS[notification.type] ?? (
          <IconSettings size={20} aria-hidden="true" />
        )}
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-start justify-between gap-2">
          <span className="font-nunito text-sm font-semibold text-foreground">
            {notification.title}
          </span>
          {!notification.is_read && (
            <span
              aria-hidden="true"
              className="mt-1.5 size-2 shrink-0 rounded-full bg-primary"
            />
          )}
        </span>
        {notification.message ? (
          <span className="mt-0.5 block truncate font-inter text-sm text-muted-foreground">
            {notification.message}
          </span>
        ) : null}
        {preview ? (
          <span className="mt-0.5 flex items-center gap-1">
            <IconMessageCircle
              size={12}
              aria-hidden="true"
              className="shrink-0 text-muted-foreground"
            />
            <span className="min-w-0 flex-1 truncate font-inter text-xs text-muted-foreground">
              {preview}
            </span>
          </span>
        ) : null}
        <span className="mt-0.5 block font-inter text-xs text-muted-foreground">
          {getRelativeTime(new Date(notification.created_at))}
        </span>
      </span>
    </button>
  );
}
