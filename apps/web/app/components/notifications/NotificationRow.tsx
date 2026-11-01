"use client";

import {
  IconCreditCard,
  IconHome,
  IconMessageCircle,
  IconSettings,
  IconTool,
} from "@tabler/icons-react";
import {
  composeNotificationRowLabel,
  getNotificationPreview,
  getNotificationRowPresentation,
  getRelativeTime,
} from "@repo/utils";

import type { FeedNotification } from "@/service/notificationService";
import { Button } from "@heroui/react";

const TYPE_ICONS: Record<string, React.ReactNode> = {
  payment: <IconCreditCard size={18} aria-hidden="true" />,
  message: <IconMessageCircle size={18} aria-hidden="true" />,
  maintenance: <IconTool size={18} aria-hidden="true" />,
  apartment: <IconHome size={18} aria-hidden="true" />,
  system: <IconSettings size={18} aria-hidden="true" />,
};

interface NotificationRowProps {
  notification: FeedNotification;
  onOpen: () => void;
  /** Expanded message members retain their own action but not sender identity. */
  compact?: boolean;
}

/**
 * One feed row: inline identity/action, secondary preview, time, unread dot.
 * The whole row is the tap target; the caller marks it read and navigates.
 */
export default function NotificationRow({
  notification,
  onOpen,
  compact = false,
}: NotificationRowProps) {
  const { action, preview } = getNotificationRowPresentation(
    notification, getNotificationPreview(notification.data),
  );
  const timestamp = getRelativeTime(new Date(notification.created_at));
  const displayedPreview = compact ? preview ?? notification.message ?? action : preview;
  const accessibleLabel = composeNotificationRowLabel({
    title: notification.title,
    message: action,
    preview: preview ?? undefined,
    isRead: notification.is_read,
    timestamp,
  });

  return (
    <Button
      variant="ghost"
      onClick={onOpen}
      aria-label={accessibleLabel}
      className={`button--bare ${compact ? "notification-feed-member" : "notification-feed-row"}`}
    >
      {!compact && <span aria-hidden="true" className="notification-feed-icon">
        {TYPE_ICONS[notification.type] ?? (
          <IconSettings size={18} aria-hidden="true" />
        )}
      </span>}
      <span className="min-w-0 flex-1">
        {!compact && (
          <span className="notification-feed-primary">
            <span className={action ? "inline-block max-w-full truncate align-bottom font-semibold" : "font-semibold"}>
              {notification.title}
            </span>
            {action ? <> {action}</> : null}
          </span>
        )}
        {displayedPreview ? (
          <span className={`notification-feed-preview ${compact ? "leading-4" : "leading-5"} ${compact && !notification.is_read ? "font-medium text-foreground" : "text-muted-foreground"}`}>
            {action ? `“${displayedPreview}”` : displayedPreview}
          </span>
        ) : null}
        <time dateTime={notification.created_at} className={`notification-feed-time ${compact ? "mt-0" : "mt-0.5"}`}>
          {timestamp}
        </time>
      </span>
      <span aria-hidden="true" className={`mt-1.5 size-1.5 shrink-0 rounded-full ${notification.is_read ? "bg-transparent" : "bg-primary"}`} />
    </Button>
  );
}
