"use client";

import { Card } from "@heroui/react";

import { joinedFormatter } from "@/app/admin/users/lib/user-display";

import EditableAvatar from "./EditableAvatar";
import EditableCover from "./EditableCover";
import RoleBadge from "./RoleBadge";
import VerificationBadge from "./VerificationBadge";

type ProfileHeaderProps = {
  authUserId: string;
  displayName: string;
  initials: string;
  role: "tenant" | "landlord";
  accountStatus: string;
  avatarUrl: string | null;
  backgroundUrl: string | null;
  joinedAt: string | null;
};

// Own-profile header, same layout as the admin profile header: cover banner,
// circular avatar overlapping its bottom edge, then name, role and
// verification chips and the join date. Photo editing is in place via
// EditableAvatar / EditableCover.
export default function ProfileHeader({
  authUserId,
  displayName,
  initials,
  role,
  accountStatus,
  avatarUrl,
  backgroundUrl,
  joinedAt,
}: ProfileHeaderProps) {
  return (
    <Card className="relative overflow-hidden rounded-3xl border border-border bg-card p-0 text-card-foreground shadow-none">
      <Card.Content className="p-0">
        <EditableCover authUserId={authUserId} initialUrl={backgroundUrl} />
        <div className="flex flex-wrap items-start gap-4 p-4">
          <div className="-mt-12 shrink-0">
            <EditableAvatar
              authUserId={authUserId}
              initialUrl={avatarUrl}
              initials={initials}
              displayName={displayName}
            />
          </div>
          <div className="min-w-0 flex-1 basis-48">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="font-nunito text-2xl font-bold wrap-break-word">
                {displayName}
              </h1>
              <RoleBadge role={role} />
              <VerificationBadge status={accountStatus} />
            </div>
            {joinedAt ? (
              <p className="mt-1 text-sm text-muted-foreground">
                Joined {joinedFormatter.format(new Date(joinedAt))}
              </p>
            ) : null}
          </div>
        </div>
      </Card.Content>
    </Card>
  );
}
