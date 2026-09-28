import Link from "next/link";
import { IconChevronRight } from "@tabler/icons-react";
import {
  activityDateFormatter,
  getAdminName,
  targetHref,
  type AdminActivityEvent,
} from "../lib/activity-display";

interface ActivityCardListProps {
  events: AdminActivityEvent[];
}

export default function ActivityCardList({ events }: ActivityCardListProps) {
  return (
    <ul className="space-y-2 md:hidden">
      {events.map((event) => {
        const href = targetHref(event.target_type, event.target_id);
        const body = (
          <>
            <div className="flex items-center gap-3">
              <div className="min-w-0 flex-1">
                <p className="truncate font-nunito font-bold">
                  {event.action.replaceAll("_", " ")}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {getAdminName(event.admin)} ·{" "}
                  {activityDateFormatter.format(new Date(event.created_at))}
                </p>
              </div>
              {href ? (
                <IconChevronRight
                  size={18}
                  className="shrink-0 text-primary"
                  aria-hidden="true"
                />
              ) : null}
            </div>
            <div className="mt-3 flex items-center justify-between gap-2 text-xs text-muted-foreground">
              <span className="truncate capitalize">
                {event.target_type.replaceAll("_", " ")}
              </span>
              <span className="shrink-0 truncate">
                {event.reason ?? "No reason given"}
              </span>
            </div>
          </>
        );
        return (
          <li key={event.id}>
            {href ? (
              <Link
                href={href}
                className="block rounded-xl border border-border bg-card p-3 hover:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                {body}
              </Link>
            ) : (
              <div className="rounded-xl border border-border bg-card p-3">
                {body}
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
