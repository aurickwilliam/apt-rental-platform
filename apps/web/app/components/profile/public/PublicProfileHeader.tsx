"use client";

import Image from "next/image";

import { Card, Tooltip } from "@heroui/react";
import { IconMapPin } from "@tabler/icons-react";
import { getInitials } from "@repo/utils";

import { joinedFormatter } from "@/app/admin/users/lib/user-display";

import RoleBadge from "../RoleBadge";
import UserAvatar from "../UserAvatar";
import VerificationBadge from "../VerificationBadge";
import PublicProfileTrustStrip, { type PublicProfileTrustItem } from "./PublicProfileTrustStrip";
import type { PublicProfileIdentity } from "./types";

interface PublicProfileHeaderProps {
  identity: PublicProfileIdentity;
  role: "tenant" | "landlord";
  /** Landlord verification facts shown under the identity, never fabricated. */
  trustItems?: PublicProfileTrustItem[];
}

const VERIFICATION_HINTS: Record<string, string> = {
  verified: "APT reviewed this account's identity.",
  pending: "Identity review is in progress.",
  rejected: "Identity verification was not approved.",
  unverified: "This account has not completed identity verification yet.",
};

// Read-only sibling of ProfileHeader: same cover + overlapping avatar layout,
// without the photo editing controls.
export default function PublicProfileHeader({ identity, role, trustItems = [] }: PublicProfileHeaderProps) {
  const { displayName, avatarUrl, backgroundUrl, accountStatus, joinedAt, location } = identity;
  const verificationHint = VERIFICATION_HINTS[accountStatus ?? "unverified"] ?? VERIFICATION_HINTS.unverified;

  return (
    <Card className="relative overflow-hidden rounded-3xl border border-border bg-card p-0 text-card-foreground shadow-none">
      <Card.Content className="p-0">
        <div className="relative h-28 w-full overflow-hidden bg-muted sm:h-32">
          {backgroundUrl ? (
            <Image src={backgroundUrl} alt="" fill unoptimized className="object-cover" />
          ) : null}
        </div>
        <div className="p-4">
          <div className="flex flex-wrap items-start gap-4">
            <div className="-mt-12 shrink-0">
              <UserAvatar
                src={avatarUrl}
                initials={getInitials(displayName)}
                alt={`${displayName}'s profile photo`}
                size="lg"
                className="size-24 rounded-full border-4 border-background bg-primary text-white"
                imageClassName="rounded-full"
                fallbackClassName="rounded-full bg-primary text-3xl font-semibold text-white"
              />
            </div>
            <div className="min-w-0 flex-1 basis-48">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="font-nunito text-2xl font-bold wrap-break-word">{displayName}</h1>
                <RoleBadge role={role} />
                <Tooltip>
                  <Tooltip.Trigger>
                    <span
                      tabIndex={0}
                      className="rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                    >
                      <VerificationBadge status={accountStatus} />
                    </span>
                  </Tooltip.Trigger>
                  <Tooltip.Content>{verificationHint}</Tooltip.Content>
                </Tooltip>
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                {location ? (
                  <span className="flex items-center gap-1">
                    <IconMapPin size={16} aria-hidden="true" />
                    {location}
                  </span>
                ) : null}
                {joinedAt ? <span>Joined {joinedFormatter.format(new Date(joinedAt))}</span> : null}
              </div>
            </div>
          </div>
          {trustItems.length > 0 ? (
            <div className="mt-4 border-t border-border pt-3">
              <PublicProfileTrustStrip items={trustItems} />
            </div>
          ) : null}
        </div>
      </Card.Content>
    </Card>
  );
}
