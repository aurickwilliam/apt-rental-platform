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
    <div className="px-4 py-3">
      <div className="flex items-center gap-3">
        <div className="h-px flex-1 bg-gray-200" />
        <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-gray-500">
          {title}
        </span>
        <div className="h-px flex-1 bg-gray-200" />
      </div>
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
    const isActive = activeContact?.id === contact.id;
    const showUnreadBadge = contact.unreadCount > 0 && !isActive;
    const unreadCountLabel = contact.unreadCount > 99 ? "99+" : String(contact.unreadCount);
    return (
      <div
        key={contact.id}
        onClick={() => onSelectContact(contact)}
        className={`p-4 cursor-pointer border-b border-gray-100 hover:bg-gray-100 transition-colors flex items-center gap-3 border-l-4 ${
          isActive
            ? "bg-blue-50/50 hover:bg-blue-50/50 border-l-blue-600"
            : "border-l-transparent"
        }`}
      >
        <div className="relative">
          {/* User Avatar */}
          <Avatar
            src={contact.avatar}
            alt={contact.name}
            size="md"
            name={contact.name}
            showFallback
            getInitials={(name) =>
              name
                .split(" ")
                .filter(Boolean)
                .slice(0, 2)
                .map((part) => part[0]?.toUpperCase() ?? "")
                .join("")
            }
          />
          {showUnreadBadge && (
            <span className="absolute -right-1.5 -top-1.5 min-w-[18px] px-1 h-[18px] rounded-full border-2 border-white bg-red-500 text-white text-[10px] font-semibold leading-none flex items-center justify-center">
              {unreadCountLabel}
            </span>
          )}
        </div>

        {/* Contact Info */}
        <div className="flex-1 overflow-hidden">
          <h3 className="font-semibold text-sm text-gray-800 truncate">{contact.name}</h3>
          <p className="text-xs text-gray-500 truncate">{contact.apartment}</p>
        </div>
      </div>
    );
  };

  return (
    <div className="flex w-1/3 min-h-0 min-w-[300px] max-w-[400px] flex-col border-r border-gray-200 bg-white">
      <div className="p-4 border-b border-gray-200">
        <h1 className="text-2xl font-semibold text-secondary">Messages</h1>
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
          <div className="px-8 pb-8 text-center text-gray-500 text-sm">
            No past inquiries yet.
          </div>
        ) : (
          pastInquiries.map(renderContact)
        )}
      </ScrollShadow>
    </div>
  );
}
