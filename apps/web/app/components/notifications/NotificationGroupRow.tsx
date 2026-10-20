"use client";

import { Button } from "@heroui/react";
import { getRelativeTime } from "@repo/utils";
import { IconChevronDown, IconMessageCircle } from "@tabler/icons-react";

import type { MessageGroupUnit } from "@/lib/notification-groups";
import { composeNotificationGroupLabel, formatMessageGroupCount } from "@/lib/notification-groups";
import type { FeedNotification } from "@/service/notificationService";

import NotificationRow from "./NotificationRow";

/**
 * One collapsed burst of chat messages: a summary row that opens the
 * conversation, plus a separate chevron that expands the underlying
 * notifications in place. The chevron is its own control, so expanding never
 * navigates and never acknowledges anything; the member rows keep the
 * existing single-row read behavior.
 */
export default function NotificationGroupRow({
  unit,
  expanded,
  onToggle,
  onOpenGroup,
  onOpenMember,
}: {
  unit: MessageGroupUnit<FeedNotification>;
  expanded: boolean;
  onToggle: () => void;
  onOpenGroup: () => void;
  onOpenMember: (notification: FeedNotification) => void;
}) {
  // Identity is the oldest loaded member: stable while realtime arrivals
  // append at the newest end, so `aria-controls` survives them.
  const membersId = `notification-group-members-${unit.members[unit.members.length - 1].id}`;
  const timestamp = getRelativeTime(new Date(unit.latest.created_at));
  const accessibleLabel = composeNotificationGroupLabel({
    senderName: unit.latest.title,
    count: unit.count,
    // Expanded members already show the message content, so the summary drops
    // the preview in both the visible row and its accessible name.
    latest: expanded ? null : unit.latest.message,
    isUnread: unit.hasUnread,
  });

  return (
    <div className="flex flex-col">
      <div className="relative">
        <button
          type="button"
          onClick={onOpenGroup}
          aria-label={`${accessibleLabel}, ${timestamp}`}
          className="notification-feed-row"
        >
          <span
            aria-hidden="true"
            className="notification-feed-icon"
          >
            <IconMessageCircle size={18} aria-hidden="true" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="notification-feed-primary pr-5">
              <span className="inline-block max-w-full truncate align-bottom font-semibold">{unit.latest.title}</span>{" "}
              {formatMessageGroupCount(unit.count).toLowerCase()}
            </span>
            {!expanded && unit.latest.message ? (
              <span className="notification-feed-preview pr-11 leading-5 text-muted-foreground">
                {`Latest: “${unit.latest.message}”`}
              </span>
            ) : null}
            <time dateTime={unit.latest.created_at} className="notification-feed-time mt-0.5">
              {timestamp}
            </time>
          </span>
          <span aria-hidden="true" className={`absolute right-3 top-2.5 size-1.5 rounded-full ${unit.hasUnread ? "bg-primary" : "bg-transparent"}`} />
        </button>
        <Button
          type="button"
          isIconOnly
          variant="ghost"
          size="sm"
          onPress={onToggle}
          aria-label={`${expanded ? "Collapse" : "Expand"} messages from ${unit.latest.title}`}
          aria-expanded={expanded}
          aria-controls={membersId}
          className="notification-group-disclosure absolute right-0.5 bottom-0.5"
        >
          <span className="notification-group-disclosure-visual">
            <IconChevronDown
              size={14}
              aria-hidden="true"
              className={`transition-transform duration-150 ${expanded ? "rotate-180" : ""}`}
            />
          </span>
        </Button>
      </div>
      {expanded ? (
        <ul
          id={membersId}
          aria-label={`Messages from ${unit.latest.title}`}
          className="notification-group-members"
        >
          {unit.members.map((member) => (
            <li key={member.id}>
              <NotificationRow notification={member} compact onOpen={() => onOpenMember(member)} />
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
