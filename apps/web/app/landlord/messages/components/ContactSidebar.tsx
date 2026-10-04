"use client";

import { Tabs, ScrollShadow, Badge } from "@heroui/react";
import { Contact, TabKey } from "./types";
import UserAvatar from "@/app/components/profile/UserAvatar";

interface ContactSidebarProps {
  contacts: Contact[];
  activeTab: TabKey;
  activeContact: Contact | null;
  onTabChange: (key: TabKey) => void;
  onSelectContact: (contact: Contact) => void;
  /** Layout overrides, used for the mobile master-detail swap. */
  className?: string;
}

export default function ContactSidebar({
  contacts,
  activeTab,
  activeContact,
  onTabChange,
  onSelectContact,
  className = "",
}: ContactSidebarProps) {
  return (
    // The 300px floor that suited a split pane starves the thread on
    // narrow screens, so the list only takes a fixed share from md up.
    <div className={`w-full min-h-0 flex-col border-r border-border bg-card md:flex md:w-1/3 md:min-w-[300px] md:max-w-[400px] md:shrink-0 ${className}`}>
      <div className="p-4 border-b border-border">
        <Tabs
          selectedKey={activeTab}
          onSelectionChange={(key) => onTabChange(key as TabKey)}
          className="w-full"
        >
          <Tabs.ListContainer>
            <Tabs.List aria-label="Message Categories" className="*:text-muted-foreground">
              <Tabs.Tab id="current" className="data-[selected=true]:text-primary">
                Current Tenants
                <Tabs.Indicator />
              </Tabs.Tab>

              <Tabs.Tab id="inquiries" className="data-[selected=true]:text-primary">
                <Tabs.Separator />
                Inquiries
                <Tabs.Indicator />
              </Tabs.Tab>
            </Tabs.List>
          </Tabs.ListContainer>
        </Tabs>
      </div>

      <ScrollShadow
        className="min-h-0 flex-1 overflow-y-auto mask-none"
        visibility="none"
      >
        {contacts.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground text-sm">
            No messages in this category.
          </div>
        ) : (
          contacts.map((contact) => {
            const isActive =
              activeContact?.conversationKey === contact.conversationKey;
            const showUnreadBadge = contact.unreadCount > 0 && !isActive;
            const unreadCountLabel =
              contact.unreadCount > 99 ? "99+" : String(contact.unreadCount);

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
                {/* Badge.Anchor handles positioning — no more manual relative/absolute */}
                <Badge.Anchor>
                  <UserAvatar
                    src={contact.avatar}
                    initials={contact.name
                      .split(" ")
                      .filter(Boolean)
                      .slice(0, 2)
                      .map((part) => part[0]?.toUpperCase() ?? "")
                      .join("")}
                    alt={contact.name}
                    size="md"
                  />
                  {showUnreadBadge && (
                    <Badge
                      color="danger"
                      size="sm"
                      placement="top-right"
                      className="border-2 border-card"
                    >
                      {unreadCountLabel}
                    </Badge>
                  )}
                </Badge.Anchor>

                <div className="flex-1 overflow-hidden">
                  <h3 className="font-semibold text-sm text-foreground truncate">
                    {contact.name}
                  </h3>
                  <p className="text-xs text-muted-foreground truncate">
                    {contact.apartment}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </ScrollShadow>
    </div>
  );
}