"use client";

import { Tabs, Tab, Avatar, ScrollShadow } from "@heroui/react";
import { Contact, TabKey } from "./types";

interface ContactSidebarProps {
  contacts: Contact[];
  activeTab: TabKey;
  activeContact: Contact | null;
  onTabChange: (key: TabKey) => void;
  onSelectContact: (contact: Contact) => void;
}

export default function ContactSidebar({
  contacts,
  activeTab,
  activeContact,
  onTabChange,
  onSelectContact,
}: ContactSidebarProps) {
  return (
    <div className="flex w-1/3 min-h-0 min-w-[300px] max-w-[400px] flex-col border-r border-gray-200 bg-gray-50/50">
      <div className="p-4 border-b border-gray-200">
        <h1 className="text-2xl font-semibold text-secondary mb-4">
          Messages
        </h1>
        <Tabs
          aria-label="Message Categories"
          selectedKey={activeTab}
          onSelectionChange={(key) => onTabChange(key as TabKey)}
          fullWidth
          size="md"
          color="primary"
        >
          <Tab key="current" title="Current Tenants" />
          <Tab key="inquiries" title="Inquiries" />
        </Tabs>
      </div>

      <ScrollShadow 
        className="min-h-0 flex-1 overflow-y-auto mask-none"
        visibility="none"
      >
        {/* Empty State */}
        {contacts.length === 0 ? (
          <div className="p-8 text-center text-gray-500 text-sm">
            No messages in this category.
          </div>
        ) : (
          contacts.map((contact) => {
            const isActive = activeContact?.id === contact.id;
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
                <Avatar src={contact.avatar} alt={contact.name} size="md" />
                <div className="flex-1 overflow-hidden">
                  <h3 className="font-semibold text-sm text-gray-800 truncate">{contact.name}</h3>
                  <p className="text-xs text-gray-500 truncate">{contact.apartment}</p>
                </div>
              </div>
            );
          })
        )}
      </ScrollShadow>
    </div>
  );
}