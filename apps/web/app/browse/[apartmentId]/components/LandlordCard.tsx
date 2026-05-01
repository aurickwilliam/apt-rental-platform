"use client";

import {
  Card,
  CardBody,
  Avatar,
  Button,
} from "@heroui/react";

import {
  MessageSquare
} from "lucide-react";

interface LandlordCardProps {
  name: string;
  avatarUrl?: string | null;
  contactInfo: string;
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
  contactInfo
}: LandlordCardProps) {
  const displayName = name.trim() || "Unknown";
  const avatarSrc = avatarUrl?.trim() || undefined;

  return (
    <Card
      shadow="none"
      classNames={{
        base: "border border-grey-300"
      }}
    >
      <CardBody className="flex flex-row items-center justify-between gap-4">
        <Avatar
          src={avatarSrc}
          alt={displayName}
          name={displayName}
          showFallback
          getInitials={getInitials}
          size="lg"
        />

        <div className="flex-1">
          <h3 className="text-lg font-medium">
            {displayName}
          </h3>
          <p className="text-sm text-grey-500">
            {contactInfo}
          </p>
        </div>

        <div>
          <Button
            isIconOnly
            variant="flat"
            color="secondary"
            radius="full"
          >
            <MessageSquare
              size={20}
              className="text-secondary"
            />
          </Button>
        </div>
      </CardBody>
    </Card>
  );
}
