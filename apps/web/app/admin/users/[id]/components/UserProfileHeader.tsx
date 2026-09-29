import Image from "next/image";
import Link from "next/link";
import { IconChevronLeft } from "@tabler/icons-react";
import { Card, Chip } from "@heroui/react";
import OperationForm from "../../../OperationForm";
import { setUserAccess } from "../../../actions/operations";
import {
  getFullName,
  getInitials,
  joinedFormatter,
  roleChipIcon,
  roleChipStyle,
  type AdminUserDetail,
} from "../../lib/user-display";
import ProfilePhoto from "./ProfilePhoto";
import UserSettingsModal from "./UserSettingsModal";
import type { UserActivityEvent } from "./UserActivityTimeline";
import type { UserVerificationItem } from "./UserVerificationCard";

interface UserProfileHeaderProps {
  user: AdminUserDetail;
  suspensionSupported: boolean;
  settings?: {
    verifications: UserVerificationItem[];
    activityEvents: UserActivityEvent[];
  };
  showBackLink?: boolean;
  headingLevel?: "h1" | "h2";
}

export default function UserProfileHeader({
  user,
  suspensionSupported,
  settings,
  showBackLink = true,
  headingLevel = "h1",
}: UserProfileHeaderProps) {
  const name = getFullName(user);
  const Heading = headingLevel;
  return (
    <Card className="relative overflow-hidden rounded-3xl border border-border bg-card p-0 shadow-none">
      <Card.Content className="p-0">
      <div className="relative h-28 w-full bg-muted sm:h-32">
        {user.background_url ? (
          <Image
            src={user.background_url}
            alt=""
            fill
            unoptimized
            className="object-cover"
          />
        ) : null}
        {showBackLink ? (
          <Link
            href="/admin/users"
            className="absolute top-3 left-3 inline-flex items-center gap-1 rounded-full bg-black/45 px-3 py-1.5 text-sm font-medium text-white backdrop-blur-sm hover:bg-black/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
          >
            <IconChevronLeft size={16} aria-hidden="true" />
            Back to users
          </Link>
        ) : null}
      </div>
      <div className="flex flex-wrap items-start gap-4 p-4">
        <ProfilePhoto
          src={user.avatar_url}
          name={name}
          initials={getInitials(name)}
        />
        <div className="min-w-0 flex-1 basis-48">
          <div className="flex flex-wrap items-center gap-2">
            <Heading className="font-nunito text-2xl font-bold wrap-break-word">
              {name}
            </Heading>
            {user.roles.map((role) => {
              const style = roleChipStyle(role);
              const RoleIcon = roleChipIcon(role);
              return (
                <Chip
                  key={role}
                  size="md"
                  variant="soft"
                  color={style.color}
                  className={`shrink-0 capitalize ${style.className ?? ""}`}
                >
                  <span className="flex items-center gap-1">
                    <RoleIcon size={14} aria-hidden="true" />
                    {role}
                  </span>
                </Chip>
              );
            })}
            {user.is_suspended ? (
              <Chip
                size="sm"
                variant="soft"
                color="danger"
                className="shrink-0"
              >
                Suspended
              </Chip>
            ) : null}
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Joined {joinedFormatter.format(new Date(user.created_at))}
          </p>
        </div>
        <div className="shrink-0">
          {settings ? (
            <UserSettingsModal
              user={user}
              verifications={settings.verifications}
              activityEvents={settings.activityEvents}
              suspensionSupported={suspensionSupported}
            />
          ) : suspensionSupported ? (
            <OperationForm
              id={user.id}
              decision={user.is_suspended ? "reactivate" : "suspend"}
              onSubmit={setUserAccess}
            />
          ) : null}
        </div>
      </div>
      </Card.Content>
    </Card>
  );
}
