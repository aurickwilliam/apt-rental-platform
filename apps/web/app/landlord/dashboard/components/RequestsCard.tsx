import Link from "next/link";
import {
  IconCalendarEvent,
  IconCircleCheck,
  IconChevronRight,
  IconFileDescription,
  IconTool,
} from "@tabler/icons-react";
import type { RequestItem } from "@repo/utils";

const ROWS = {
  applications: {
    Icon: IconFileDescription,
    singular: "new application",
    href: "/landlord/applications",
  },
  visits: {
    Icon: IconCalendarEvent,
    singular: "visit request",
    href: "/landlord/visit-requests",
  },
  maintenance: {
    Icon: IconTool,
    singular: "new maintenance request",
    href: "/landlord/maintenance-requests",
  },
} as const;

type Props = {
  items: RequestItem[];
  /** Layout classes from the parent grid. */
  className?: string;
};

export default function RequestsCard({ items, className = "" }: Props) {
  return (
    <div className={`rounded-3xl border border-border bg-card p-5 ${className}`}>
      <h3 className="mb-3 font-nunito text-xl font-bold text-primary">
        Waiting for your reply
      </h3>

      {items.length === 0 ? (
        <p className="flex items-center gap-2 py-4 text-sm text-muted-foreground">
          <IconCircleCheck size={20} className="shrink-0 text-primary" aria-hidden="true" />
          You&apos;re all caught up. Nothing needs your reply right now.
        </p>
      ) : (
        <ul className="space-y-1">
          {items.map(({ key, count }) => {
            const { Icon, singular, href } = ROWS[key];
            return (
              <li key={key}>
                <Link
                  href={href}
                  className="flex cursor-pointer items-center gap-3 rounded-lg p-2 transition-colors hover:bg-muted"
                >
                  <span className="rounded-full bg-primary/10 p-2 text-primary">
                    <Icon size={18} />
                  </span>
                  <span className="flex-1 text-sm font-medium text-foreground">
                    {count} {singular}
                    {count === 1 ? "" : "s"}
                  </span>
                  <IconChevronRight size={16} className="text-muted-foreground" />
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
