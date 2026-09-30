import Link from "next/link";
import { IconChevronRight } from "@tabler/icons-react";
import type { RecentItem } from "../lib/get-dashboard-data";
import SharedUserAvatar from "@/app/components/profile/UserAvatar";

interface RecentUserCardProps {
  user: RecentItem;
}

const dateFormatter = new Intl.DateTimeFormat("en-PH", {
  dateStyle: "medium",
  timeZone: "Asia/Manila",
});

export default function RecentUserCard({ user }: RecentUserCardProps) {
  const initials = user.name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

  return (
    <Link
      href={user.href}
      className="flex items-center gap-3 rounded-3xl bg-muted/50 p-3 transition-colors hover:bg-muted/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
    >
      <SharedUserAvatar
        src={user.image}
        initials={initials}
        alt={user.name}
        size="sm"
        className="shrink-0 bg-primary/10 text-primary"
        fallbackClassName="bg-primary/10 text-primary"
      />
      <span className="min-w-0 flex-1">
        <span className="block truncate font-nunito text-sm font-bold">
          {user.name}
        </span>
        <span className="flex min-w-0 items-center gap-1.5 text-xs text-muted-foreground">
          <span className="truncate">{user.detail}</span>
          <span aria-hidden="true" className="shrink-0">
            ·
          </span>
          <time dateTime={user.date} className="shrink-0">
            {dateFormatter.format(new Date(user.date))}
          </time>
        </span>
      </span>
      <IconChevronRight
        size={16}
        className="shrink-0 text-primary"
        aria-hidden="true"
      />
    </Link>
  );
}
