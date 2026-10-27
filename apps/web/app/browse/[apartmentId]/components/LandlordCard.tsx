"use client";

import {
  Card,
  Button,
  Tooltip,
} from "@heroui/react";

import Link from "next/link";

import {
  IconMessage
} from "@tabler/icons-react";

import UserAvatar from "@/app/components/profile/UserAvatar";

interface LandlordCardProps {
  className?: string;
  name: string;
  avatarUrl?: string | null;
  onMessagePress?: () => void;
  isMessageDisabled?: boolean;
  messageDisabledReason?: string;
  showMessageButton?: boolean;
  /** When set, the avatar and name open the landlord's profile page. */
  profileHref?: string;
}

const getInitials = (value: string) => {
  const normalized = value.trim();
  if (!normalized) return "U";
  const parts = normalized.split(/\s+/).filter(Boolean);
  const initials = parts
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
  return initials || "U";
};

const IDENTITY_CLASS = "flex min-w-0 flex-1 flex-row items-center gap-4";

export default function LandlordCard({
  className = "",
  name,
  avatarUrl,
  onMessagePress,
  isMessageDisabled = false,
  messageDisabledReason = "",
  showMessageButton = true,
  profileHref,
}: LandlordCardProps) {
  const displayName = name.trim() || "Unknown";
  const avatarSrc = avatarUrl?.trim() || undefined;

  const identity = (
    <>
      <UserAvatar
        src={avatarSrc}
        initials={getInitials(displayName)}
        alt={displayName}
        size="lg"
      />

      <div className="min-w-0 flex-1">
        <Card.Title>
          {displayName}
        </Card.Title>
        <Card.Description className="text-grey-500">
          Landlord
        </Card.Description>
      </div>
    </>
  );

  return (
    <Card
      className={`border border-border shadow-none transition-colors ${profileHref ? "hover:border-primary" : ""} ${className}`}
    >
      <Card.Content className="flex flex-row items-center justify-between gap-4">
        {profileHref ? (
          <Link
            href={profileHref}
            aria-label={`View ${displayName}'s profile`}
            className={`${IDENTITY_CLASS} cursor-pointer rounded-xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary`}
          >
            {identity}
          </Link>
        ) : (
          <div className={IDENTITY_CLASS}>{identity}</div>
        )}

        {showMessageButton ? (
          <Tooltip isDisabled={!isMessageDisabled || !messageDisabledReason}>
            <Tooltip.Trigger>
              {/* span keeps tooltip working on a disabled button */}
              <span>
                <Button
                  isIconOnly
                  variant="tertiary"
                  isDisabled={isMessageDisabled}
                  onPress={onMessagePress}
                >
                  <IconMessage size={20} className="text-brand" />
                </Button>
              </span>
            </Tooltip.Trigger>
            <Tooltip.Content>
              {messageDisabledReason}
            </Tooltip.Content>
          </Tooltip>
        ) : null}
      </Card.Content>
    </Card>
  );
}
