"use client";

import { Button } from "@heroui/react";
import { IconChevronLeft } from "@tabler/icons-react";
import UserAvatar from "@/app/components/profile/UserAvatar";

interface ConversationHeaderProps {
  contact: { name: string; avatar: string; apartment: string };
  onBack?: () => void;
}

export default function ConversationHeader({ contact, onBack }: ConversationHeaderProps) {
  return (
    <div data-fab-clearance="conversation-header" data-fab-dock="conversation-header" className="z-10 flex min-h-20 shrink-0 items-center gap-3 border-b border-border bg-card px-4 py-3 pr-16 sm:px-6 sm:pr-16">
      {onBack && <Button variant="ghost" isIconOnly size="sm" onPress={onBack} aria-label="Back to conversations" className="lg:hidden"><IconChevronLeft size={20} aria-hidden="true" /></Button>}
      <UserAvatar src={contact.avatar} initials={contact.name.split(" ").filter(Boolean).slice(0, 2).map((part) => part[0]).join("")} alt={contact.name} size="md" />
      <div className="min-w-0">
        <h2 className="truncate font-nunito text-sm font-bold leading-5 text-foreground">{contact.name}</h2>
        <p className="mt-0.5 truncate font-inter text-xs text-muted-foreground">{contact.apartment}</p>
      </div>
    </div>
  );
}
