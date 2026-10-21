"use client";

import { Button } from "@heroui/react";
import UserAvatar from "@/app/components/profile/UserAvatar";
import type { ConversationContact } from "@/lib/conversation-contacts";
import { useHydrated } from "@/hooks/use-hydrated";

interface ConversationRowProps {
  contact: ConversationContact;
  isActive: boolean;
  onSelect: () => void;
}

export default function ConversationRow({ contact, isActive, onSelect }: ConversationRowProps) {
  const hydrated = useHydrated();
  const unread = !isActive && contact.unreadCount > 0;
  const date = contact.lastMessageTime ? new Date(contact.lastMessageTime) : null;
  const validDate = date && Number.isFinite(date.getTime()) ? date : null;
  const preview = contact.lastMessage?.trim() || (
    contact.lastMessageType === "image" ? "Photo" :
    contact.lastMessageType === "video" ? "Video" :
    contact.lastMessageType === "gif" ? "GIF" :
    contact.lastMessageType === "file" ? "Document" : null
  );

  return (
    <Button variant="ghost" onPress={onSelect} aria-current={isActive ? "true" : undefined}
      aria-label={`${contact.name}, ${contact.apartment}${preview ? `, ${preview}` : ""}${unread ? `, ${contact.unreadCount} unread messages` : ""}`}
      className="apt-conversation-row" data-active={isActive}>
      <UserAvatar src={contact.avatar} initials={contact.name.split(" ").filter(Boolean).slice(0, 2).map((part) => part[0]).join("")} alt={contact.name} size="lg" />
      <span className="min-w-0 flex-1 text-left">
        <span className="flex items-center gap-2">
          <span className={`truncate font-nunito text-sm ${unread ? "font-bold" : "font-semibold"}`}>{contact.name}</span>
          {hydrated && validDate && <time dateTime={contact.lastMessageTime!} title={validDate.toLocaleString()} className="ml-auto shrink-0 font-inter text-[11px] text-muted-foreground">
            {validDate.toLocaleDateString() === new Date().toLocaleDateString()
              ? validDate.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })
              : validDate.toLocaleDateString([], { month: "short", day: "numeric" })}
          </time>}
        </span>
        <span className="mt-0.5 block truncate font-inter text-[11px] text-muted-foreground">{contact.apartment}</span>
        {preview && <span className={`mt-1 block truncate font-inter text-xs ${unread ? "font-medium text-foreground" : "text-muted-foreground"}`}>{preview}</span>}
      </span>
      {unread && <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-white">{contact.unreadCount > 99 ? "99+" : contact.unreadCount}</span>}
    </Button>
  );
}
