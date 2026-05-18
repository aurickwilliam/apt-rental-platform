"use client";

import {
  Card,
  Avatar,
  Button,
  Tooltip,
} from "@heroui/react";

import {
  MessageSquare
} from "lucide-react";

interface LandlordCardProps {
  name: string;
  avatarUrl?: string | null;
  contactInfo: string;
  onMessagePress?: () => void;
  isMessageDisabled?: boolean;
  messageDisabledReason?: string;
  showMessageButton?: boolean;
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

export default function LandlordCard({
  name,
  avatarUrl,
  contactInfo,
  onMessagePress,
  isMessageDisabled = false,
  messageDisabledReason = "",
  showMessageButton = true,
}: LandlordCardProps) {
  const displayName = name.trim() || "Unknown";
  const avatarSrc = avatarUrl?.trim() || undefined;

  return (
    <Card className="border border-grey-300 shadow-none">
      <Card.Content className="flex flex-row items-center justify-between gap-4">
        <Avatar size="lg">
          <Avatar.Image src={avatarSrc} alt={displayName} />
          <Avatar.Fallback>{getInitials(displayName)}</Avatar.Fallback>
        </Avatar>

        <div className="flex-1">
          <Card.Title>
            {displayName}
          </Card.Title>
          <Card.Description className="text-grey-500">
            {contactInfo}
          </Card.Description>
        </div>

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
                  <MessageSquare size={20} className="text-secondary" />
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
