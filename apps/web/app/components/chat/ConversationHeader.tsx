"use client";

import Link from "next/link";
import { Button } from "@heroui/react";
import { IconChevronLeft, IconX } from "@tabler/icons-react";
import UserAvatar from "@/app/components/profile/UserAvatar";

interface ConversationHeaderProps {
  contact: { name: string; avatar: string; apartment: string };
  onBack?: () => void;
  /**
   * Floating chat window style (Messenger / Instagram): a slim row with the
   * name, the apartment as a link under it and a close button, instead of the
   * full-width page header.
   */
  popup?: { subtitle: string; subtitleHref?: string; onClose: () => void };
}

export default function ConversationHeader({ contact, onBack, popup }: ConversationHeaderProps) {
  const initials = contact.name.split(" ").filter(Boolean).slice(0, 2).map((part) => part[0]).join("");

  if (popup) {
    return (
      // No `data-fab-dock`: the notification bell parks only in the Messages page header.
      <div data-fab-clearance="conversation-header" className="z-10 flex h-14 shrink-0 items-center gap-2.5 border-b border-border bg-card pl-3 pr-2">
        <UserAvatar src={contact.avatar} initials={initials} alt={contact.name} size="sm" />
        <div className="min-w-0 flex-1">
          <h2 className="truncate font-nunito text-sm font-bold leading-4 text-foreground">{contact.name}</h2>
          {popup.subtitleHref ? (
            <Link href={popup.subtitleHref} className="block truncate font-inter text-xs leading-4 text-muted-foreground hover:text-primary hover:underline focus-visible:outline-2 focus-visible:outline-primary">
              {popup.subtitle}
            </Link>
          ) : (
            <p className="truncate font-inter text-xs leading-4 text-muted-foreground">{popup.subtitle}</p>
          )}
        </div>
        <Button isIconOnly variant="ghost" size="sm" aria-label="Close chat" onPress={popup.onClose} className="shrink-0 cursor-pointer text-primary">
          <IconX size={20} aria-hidden="true" />
        </Button>
      </div>
    );
  }

  return (
    <div data-fab-clearance="conversation-header" data-fab-dock="conversation-header" className="z-10 flex min-h-20 shrink-0 items-center gap-3 border-b border-border bg-card px-4 py-3 pr-16 sm:px-6 sm:pr-16">
      {onBack && <Button variant="ghost" isIconOnly size="sm" onPress={onBack} aria-label="Back to conversations" className="lg:hidden"><IconChevronLeft size={20} aria-hidden="true" /></Button>}
      <UserAvatar src={contact.avatar} initials={initials} alt={contact.name} size="md" />
      <div className="min-w-0">
        <h2 className="truncate font-nunito text-sm font-bold leading-5 text-foreground">{contact.name}</h2>
        <p className="mt-0.5 truncate font-inter text-xs text-muted-foreground">{contact.apartment}</p>
      </div>
    </div>
  );
}
