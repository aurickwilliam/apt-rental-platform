import Link from "next/link";
import { Card } from "@heroui/react";
import { IconHistory } from "@tabler/icons-react";
import { activityDateFormatter } from "../../../activity/lib/activity-display";

export interface UserActivityEvent {
  id: string;
  action: string;
  target_type: string;
  target_id: string;
  reason: string | null;
  created_at: string;
  admin_name: string;
}

interface UserActivityTimelineProps {
  events: UserActivityEvent[];
}

function targetHref(targetType: string, targetId: string) {
  if (targetType === "user") return `/admin/users/${targetId}`;
  if (targetType === "apartment") return `/admin/apartments/${targetId}`;
  return null;
}

export default function UserActivityTimeline({ events }: UserActivityTimelineProps) {
  return (
    <Card className="rounded-3xl border border-border bg-card p-4 shadow-none sm:p-5">
      <Card.Content className="p-0">
      <h2 className="flex items-center gap-2 font-nunito text-lg font-bold text-primary">
        <IconHistory size={20} className="shrink-0 text-primary" aria-hidden="true" />
        Activity timeline
      </h2>
      {events.length ? (
        <ul className="mt-3 space-y-3 text-sm">
          {events.map((event) => {
            const href = targetHref(event.target_type, event.target_id);
            return (
              <li key={event.id} className="relative flex gap-3 pl-5">
                <span
                  aria-hidden="true"
                  className="absolute top-1.5 left-0 size-2 shrink-0 rounded-full bg-primary/60"
                />
                <span className="min-w-0 flex-1 wrap-break-word">
                  <span className="font-medium">
                    {event.action.replaceAll("_", " ")}
                  </span>{" "}
                  <span className="text-muted-foreground">
                    by {event.admin_name}
                    {href ? (
                      <>
                        {" · "}
                        <Link
                          href={href}
                          className="font-semibold text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                        >
                          {event.target_type.replaceAll("_", " ")}
                        </Link>
                      </>
                    ) : (
                      ` · ${event.target_type.replaceAll("_", " ")}`
                    )}
                    {event.reason ? ` — ${event.reason}` : ""}
                  </span>
                </span>
                <span className="shrink-0 text-xs text-muted-foreground">
                  {activityDateFormatter.format(new Date(event.created_at))}
                </span>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="mt-3 text-sm text-muted-foreground">
          No account activity yet
        </p>
      )}
      </Card.Content>
    </Card>
  );
}
