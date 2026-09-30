"use client";

import { Card } from "@heroui/react";

import EditableAvatar from "./EditableAvatar";
import EditableCover from "./EditableCover";
import RoleBadge from "./RoleBadge";
import VerificationBadge from "./VerificationBadge";

type ProfileHeaderProps = {
  authUserId: string;
  displayName: string;
  initials: string;
  email: string | null;
  role: "tenant" | "landlord";
  accountStatus: string;
  avatarUrl: string | null;
  backgroundUrl: string | null;
};

// Own-profile header: cover banner with circular avatar overlapping its
// bottom-left edge, identity content to the right (stacked below on
// mobile). Photo editing is in place via EditableAvatar / EditableCover.
export default function ProfileHeader({
  authUserId,
  displayName,
  initials,
  email,
  role,
  accountStatus,
  avatarUrl,
  backgroundUrl,
}: ProfileHeaderProps) {
  return (
    <Card className="overflow-hidden border border-border bg-card text-card-foreground rounded-2xl">
      <Card.Content className="p-0">
        <EditableCover authUserId={authUserId} initialUrl={backgroundUrl} />
        <div className="px-6 pb-6">
          <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:items-end sm:gap-6 sm:text-left">
            <div className="-mt-16 shrink-0 sm:-mt-20">
              <EditableAvatar
                authUserId={authUserId}
                initialUrl={avatarUrl}
                initials={initials}
                displayName={displayName}
              />
            </div>
            <div className="flex min-w-0 flex-1 flex-col items-center gap-1.5 sm:items-start sm:pb-1">
              <h1 className="text-2xl font-bold">{displayName}</h1>
              <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                <RoleBadge role={role} />
                <VerificationBadge status={accountStatus} />
              </div>
              {email ? (
                <p className="text-sm text-muted-foreground truncate max-w-full">{email}</p>
              ) : null}
            </div>
          </div>
        </div>
      </Card.Content>
    </Card>
  );
}
