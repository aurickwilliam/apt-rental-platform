"use client";

import { IconBell, IconLayoutSidebarLeftExpand } from "@tabler/icons-react";

import { useTranslation } from "@/app/components/i18n/LocaleProvider";
import { useNotificationDisplayPreferences } from "@/hooks/use-notification-display-preferences";
import type {
  NotificationDrawerSide,
  NotificationEntry,
} from "@/lib/notification-display-preferences";

import SectionTitle from "./SectionTitle";
import SettingsRow from "./SettingsRow";
import SettingsSelect from "./SettingsSelect";

const ENTRY_OPTION_KEYS = [
  { value: "bell", labelKey: "settings.notifications.entry.bell" },
  { value: "sidebar", labelKey: "settings.notifications.entry.sidebar" },
] as const;

const SIDE_OPTION_KEYS = [
  { value: "right", labelKey: "settings.notifications.drawer.right" },
  { value: "left", labelKey: "settings.notifications.drawer.left" },
] as const;

/**
 * Where notifications are opened from and which edge the drawer slides in
 * from. Stored per browser (not on the account), applied immediately.
 */
export default function NotificationDisplaySettings() {
  const { t } = useTranslation();
  const { preferences, update } = useNotificationDisplayPreferences();
  const entryOptions = ENTRY_OPTION_KEYS.map(({ value, labelKey }) => ({
    value,
    label: t(labelKey),
  }));
  const sideOptions = SIDE_OPTION_KEYS.map(({ value, labelKey }) => ({
    value,
    label: t(labelKey),
  }));

  return (
    <div>
      <div className="px-4 pb-3">
        <SectionTitle title={t("settings.notifications.display")} />
      </div>
      <p className="px-4 pb-3 text-sm text-muted-foreground">
        {t("settings.notifications.display.description")}
      </p>
      <div className="divide-y divide-border">
        <SettingsRow
          icon={<IconBell size={20} aria-hidden="true" />}
          title={t("settings.notifications.entry.title")}
          description={t("settings.notifications.entry.description")}
          suffix={
            <SettingsSelect
              label={t("settings.notifications.entry.title")}
              value={preferences.entry}
              options={entryOptions}
              onChange={(value) => update({ entry: value as NotificationEntry })}
              className="w-40"
            />
          }
        />
        <SettingsRow
          icon={<IconLayoutSidebarLeftExpand size={20} aria-hidden="true" />}
          title={t("settings.notifications.drawer.title")}
          description={t("settings.notifications.drawer.description")}
          suffix={
            <SettingsSelect
              label={t("settings.notifications.drawer.title")}
              value={preferences.drawerSide}
              options={sideOptions}
              onChange={(value) => update({ drawerSide: value as NotificationDrawerSide })}
              className="w-32"
            />
          }
        />
      </div>
    </div>
  );
}
