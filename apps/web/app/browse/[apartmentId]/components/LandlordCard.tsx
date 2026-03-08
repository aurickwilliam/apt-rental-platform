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
  avatarUrl: string;
  contactInfo: string;
}

export default function LandlordCard({
  name,
  avatarUrl,
  contactInfo
}: LandlordCardProps) {
  return (
    <Card
      shadow="none"
      classNames={{
        base: "border border-grey-300"
      }}
    >
      <CardBody className="flex flex-row items-center justify-between gap-4">
        <Avatar
          src={avatarUrl}
          alt={name}
          size="lg"
        />

        <div className="flex-1">
          <h3 className="text-lg font-medium">
            {name}
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
