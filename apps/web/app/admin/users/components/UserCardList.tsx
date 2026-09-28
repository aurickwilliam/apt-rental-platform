import Link from "next/link";
import { IconChevronRight } from "@tabler/icons-react";
import { Chip } from "@heroui/react";
import UserAvatar from "./UserAvatar";
import {
  formatRoles,
  getUserName,
  joinedFormatter,
  verificationChipColor,
  type AdminUser,
} from "../lib/user-display";

interface UserCardListProps {
  users: AdminUser[];
}

export default function UserCardList({ users }: UserCardListProps) {
  return (
    <ul className="space-y-2 md:hidden">
      {users.map((user) => {
        const name = getUserName(user);
        return (
          <li key={user.id}>
            <Link
              href={`/admin/users/${user.id}`}
              className="block rounded-xl border border-border bg-card p-3 hover:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <div className="flex items-center gap-3">
                <UserAvatar user={user} name={name} />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-nunito font-bold">{name}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {user.email}
                  </p>
                </div>
                <IconChevronRight
                  size={18}
                  className="shrink-0 text-primary"
                  aria-hidden="true"
                />
              </div>
              <div className="mt-3 flex items-center justify-between gap-2 text-xs text-muted-foreground">
                <span className="truncate">
                  {formatRoles(user.roles)} ·{" "}
                  {joinedFormatter.format(new Date(user.created_at))}
                </span>
                <Chip
                  size="sm"
                  variant="soft"
                  color={verificationChipColor(user.account_status)}
                  className="shrink-0 capitalize"
                >
                  {user.account_status}
                </Chip>
              </div>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
