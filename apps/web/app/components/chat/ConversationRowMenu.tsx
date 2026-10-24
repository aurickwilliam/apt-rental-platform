"use client";

import type { ComponentType } from "react";
import { Dropdown } from "@heroui/react";
import {
  IconArchive,
  IconArchiveOff,
  IconBan,
  IconBell,
  IconBellOff,
  IconBuilding,
  IconDots,
  IconFlag,
  IconMail,
  IconMailOpened,
  IconPin,
  IconPinnedOff,
} from "@tabler/icons-react";

import type { ConversationContact } from "@/lib/conversation-contacts";
import { getConversationMenuItems, type ConversationMenuAction, type ConversationMenuItem } from "@/lib/conversation-list";

type MenuIcon = ComponentType<{ size?: number; className?: string; "aria-hidden"?: boolean }>;

/** Icon for each option; toggles swap with the label ("Pin" ↔ "Unpin"). */
function iconFor(item: ConversationMenuItem): MenuIcon {
  switch (item.action) {
    case "togglePin": return item.label === "Unpin" ? IconPinnedOff : IconPin;
    case "toggleArchive": return item.label === "Unarchive" ? IconArchiveOff : IconArchive;
    case "toggleRead": return item.label === "Mark as read" ? IconMailOpened : IconMail;
    case "viewApartment": return IconBuilding;
    case "toggleMute": return item.label === "Unmute notifications" ? IconBell : IconBellOff;
    case "report": return IconFlag;
    case "toggleBlock": return IconBan;
  }
}

interface ConversationRowMenuProps {
  contact: ConversationContact;
  /** Pinned by the app (current landlord / active tenants): Pin and Archive are disabled. */
  pinLocked: boolean;
  onAction: (action: ConversationMenuAction, contact: ConversationContact, pinLocked: boolean) => void;
}

/** The "···" menu on a conversation row (mobile's `ConversationMoreSheet`, as a HeroUI menu). */
export default function ConversationRowMenu({ contact, pinLocked, onAction }: ConversationRowMenuProps) {
  const items = getConversationMenuItems(contact, pinLocked);

  return (
    <Dropdown>
      <Dropdown.Trigger
        aria-label={`More options for ${contact.name}`}
        className="apt-conversation-menu-trigger flex size-8 cursor-pointer items-center justify-center rounded-full bg-card text-muted-foreground shadow-sm hover:text-foreground"
      >
        <IconDots size={18} aria-hidden />
      </Dropdown.Trigger>
      <Dropdown.Popover placement="bottom end" className="min-w-56">
        <Dropdown.Menu
          aria-label={`Options for ${contact.name}`}
          disabledKeys={items.filter((item) => item.disabled).map((item) => item.action)}
          onAction={(key) => onAction(key as ConversationMenuAction, contact, pinLocked)}
        >
          {items.map((item) => {
            const Icon = iconFor(item);
            return (
              <Dropdown.Item
                key={item.action}
                id={item.action}
                textValue={item.label}
                variant={item.destructive ? "danger" : "default"}
                className={item.destructive ? "text-danger" : undefined}
              >
                <Icon size={18} className="shrink-0" aria-hidden />
                <span className="flex min-w-0 flex-col">
                  <span className="text-sm">{item.label}</span>
                  {item.note ? <span className="text-xs text-muted-foreground">{item.note}</span> : null}
                </span>
              </Dropdown.Item>
            );
          })}
        </Dropdown.Menu>
      </Dropdown.Popover>
    </Dropdown>
  );
}
