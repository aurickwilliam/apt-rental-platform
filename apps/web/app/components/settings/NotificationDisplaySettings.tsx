"use client";

import { IconBell, IconLayoutSidebarLeftExpand } from "@tabler/icons-react";

import { useNotificationDisplayPreferences } from "@/hooks/use-notification-display-preferences";
import type {
  NotificationDrawerSide,
  NotificationEntry,
} from "@/lib/notification-display-preferences";

import SectionTitle from "./SectionTitle";
import SettingsRow from "./SettingsRow";
import SettingsSelect from "./SettingsSelect";

const ENTRY_OPTIONS = [
  { value: "bell", label: "Floating bell" },
  { value: "sidebar", label: "Sidebar tab" },
] as const;

const SIDE_OPTIONS = [
  { value: "right", label: "Right" },
  { value: "left", label: "Left" },
] as const;

/**
 * Where notifications are opened from and which edge the drawer slides in
 * from. Stored per browser (not on the account), applied immediately.
 */
export default function NotificationDisplaySettings() {
  const { preferences, update } = useNotificationDisplayPreferences();

  return (
    <div>
      <div className="px-4 pb-3">
        <SectionTitle title="Display" />
      </div>
      <p className="px-4 pb-3 text-sm text-muted-foreground">
        Applies to this browser. On phones, notifications stay in the navigation menu.
      </p>
      <div className="divide-y divide-border">
        <SettingsRow
          icon={<IconBell size={20} aria-hidden="true" />}
          title="Open notifications from"
          description="A draggable bell on the page, or a tab in the sidebar."
          suffix={
            <SettingsSelect
              label="Open notifications from"
              value={preferences.entry}
              options={ENTRY_OPTIONS}
              onChange={(value) => update({ entry: value as NotificationEntry })}
              className="w-40"
            />
          }
        />
        <SettingsRow
          icon={<IconLayoutSidebarLeftExpand size={20} aria-hidden="true" />}
          title="Drawer position"
          description="Which side the notifications drawer opens from."
          suffix={
            <SettingsSelect
              label="Drawer position"
              value={preferences.drawerSide}
              options={SIDE_OPTIONS}
              onChange={(value) => update({ drawerSide: value as NotificationDrawerSide })}
              className="w-32"
            />
          }
        />
      </div>
    </div>
  );
}
