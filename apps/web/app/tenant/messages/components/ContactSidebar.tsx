"use client";

import { Avatar, ScrollShadow } from "@heroui/react";
import { Contact } from "./types";

interface ContactSidebarProps {
  myLandlord: Contact[];
  pastInquiries: Contact[];
  activeContact: Contact | null;
  onSelectContact: (contact: Contact) => void;
}

function SectionSeparator({ title }: { title: string }) {
  return (
    <div className="px-4 py-3 flex flex-col gap-1">
      <span className={`text-base font-medium ${title === "My Landlord" ? "text-primary" : "text-muted-foreground"}`}>
        {title}
      </span>
      <div className="h-1 rounded-full bg-border" />
    </div>
  );
}

export default function ContactSidebar({
  myLandlord,
  pastInquiries,
  activeContact,
  onSelectContact,
}: ContactSidebarProps) {
  const renderContact = (contact: Contact) => {
    const isActive = activeContact?.conversationKey === contact.conversationKey;
    const showUnreadBadge = contact.unreadCount > 0 && !isActive;
    const unreadCountLabel = contact.unreadCount > 99 ? "99+" : String(contact.unreadCount);
    return (
      <div
        key={contact.conversationKey}
        onClick={() => onSelectContact(contact)}
        className={`p-4 cursor-pointer border-b border-border/50 hover:bg-accent transition-colors flex items-center gap-3 border-l-4 ${
          isActive
            ? "bg-primary/10 hover:bg-primary/10 border-l-primary"
            : "border-l-transparent"
        }`}
      >
        <div className="relative">
          {/* User Avatar */}
          <Avatar size="md">
            <Avatar.Image src={contact.avatar} alt={contact.name} />
            <Avatar.Fallback>
              {contact.name
                .split(" ")
                .filter(Boolean)
                .slice(0, 2)
                .map((part) => part[0]?.toUpperCase() ?? "")
                .join("")}
            </Avatar.Fallback>
          </Avatar>
          
          {showUnreadBadge && (
            <span className="absolute -right-1.5 -top-1.5 min-w-[18px] px-1 h-[18px] rounded-full border-2 border-card bg-destructive text-destructive-foreground text-[10px] font-semibold leading-none flex items-center justify-center">
              {unreadCountLabel}
            </span>
          )}
        </div>

        {/* Contact Info */}
        <div className="flex-1 overflow-hidden">
          <h3 className="font-semibold text-sm text-foreground truncate">{contact.name}</h3>
          <p className="text-xs text-muted-foreground truncate">{contact.apartment}</p>
        </div>
      </div>
    );
  };

  return (
    <div className="flex w-1/3 min-h-0 min-w-[300px] max-w-[400px] flex-col border-r border-border bg-card">
      <div className="p-4 border-b border-border">
        <p className="text-xs text-muted-foreground">Conversations</p>
      </div>

      <ScrollShadow
        className="min-h-0 flex-1 overflow-y-auto mask-none"
        visibility="none"
      >
        {myLandlord.length > 0 && (
          <>
            <SectionSeparator title="My Landlord" />
            {myLandlord.map(renderContact)}
          </>
        )}

        <SectionSeparator title="Past Inquiries" />
        {pastInquiries.length === 0 ? (
          <div className="px-8 pb-8 text-center text-muted-foreground text-sm">
            No past inquiries yet.
          </div>
        ) : (
          pastInquiries.map(renderContact)
        )}
      </ScrollShadow>
    </div>
  );
}
