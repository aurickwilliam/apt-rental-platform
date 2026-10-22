import Link from "next/link";
import {
  IconCalendarEvent,
  IconChevronRight,
  IconFileDescription,
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
} as const;

type Props = {
  items: RequestItem[];
};

export default function RequestsCard({ items }: Props) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <h3 className="mb-3 text-base font-medium text-foreground">
        Waiting for your reply
      </h3>
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
    </div>
  );
}
