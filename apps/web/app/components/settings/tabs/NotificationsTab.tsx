"use client";

import {
  IconCreditCard,
  IconHome,
  IconMessageCircle,
  IconSettings,
  IconTool,
} from "@tabler/icons-react";
import { Button, Spinner } from "@heroui/react";

import { useTranslation } from "@/app/components/i18n/LocaleProvider";
import NotificationDisplaySettings from "../NotificationDisplaySettings";
import SettingsRow from "../SettingsRow";
import SectionTitle from "../SectionTitle";
import ToggleSwitch from "../ToggleSwitch";
import { useNotificationPreferences } from "../hooks/use-notification-prefs";

const TYPE_ICONS: Record<string, React.ReactNode> = {
  payment: <IconCreditCard size={20} aria-hidden="true" />,
  message: <IconMessageCircle size={20} aria-hidden="true" />,
  maintenance: <IconTool size={20} aria-hidden="true" />,
  apartment: <IconHome size={20} aria-hidden="true" />,
  system: <IconSettings size={20} aria-hidden="true" />,
};

export default function NotificationsTab({
  isAdmin = false,
}: {
  isAdmin?: boolean;
}) {
  const { t } = useTranslation();
  const { preferences, loading, GENERAL_TOGGLES, NOTIFICATION_TYPE_LABELS, toggleGeneral, toggleType, resetToDefaults } = useNotificationPreferences();

  const typesDisabled = !preferences.notifications_enabled && !preferences.push_enabled;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner color="accent" aria-label={t("settings.notifications.loading")} />
      </div>
    );
  }

  return (
    <>
      <h2 className="font-nunito text-lg font-bold text-primary">
        {t("settings.notifications.title")}
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">
        {isAdmin
          ? t("settings.notifications.admin.description")
          : t("settings.notifications.description")}
      </p>
      <div className="mt-3 divide-y divide-border">
        {isAdmin ? (
          <div>
            <div className="px-4 pb-3">
              <SectionTitle title={t("settings.notifications.verification")} />
            </div>
            <div className="divide-y divide-border">
              <SettingsRow
                icon={TYPE_ICONS.system}
                title={t("settings.notifications.verification")}
                description={t("settings.notifications.verification.description")}
                suffix={
                  <ToggleSwitch
                    isSelected={preferences.system}
                    onValueChange={() => toggleType("system")}
                    disabled={typesDisabled}
                    aria-label={t("settings.notifications.verification")}
                  />
                }
              />
            </div>
            <p className="px-4 py-3 text-xs text-muted-foreground">
              {t("settings.notifications.verification.note")}
            </p>
          </div>
        ) : null}
        <NotificationDisplaySettings />

        {/* General */}

        <div>
          <div className="px-4 pb-3">
            <SectionTitle title={t("settings.notifications.general")} />
          </div>
          <div className="divide-y divide-border">
            {GENERAL_TOGGLES.filter(({ key }) => !isAdmin || key !== "show_chat_toasts").map(({ key, icon, title, description }) => (
              <SettingsRow
                key={key}
                icon={icon}
                title={title}
                description={description}
                suffix={
                  <ToggleSwitch
                    isSelected={preferences[key]}
                    onValueChange={() => toggleGeneral(key)}
                    aria-label={title}
                  />
                }
              />
            ))}
          </div>
        </div>

        {/* Notification Types — admins only receive system alerts, shown above */}
        {!isAdmin ? (
          <div className="pt-6">
            <div className="px-4 pb-3">
              <SectionTitle title={t("settings.notifications.types")} />
            </div>
            <p className="px-4 pb-3 text-sm text-muted-foreground">
              {t("settings.notifications.types.note")}
            </p>
            <div className="divide-y divide-border">
              {NOTIFICATION_TYPE_LABELS.map(({ type, label }) => (
                <SettingsRow
                  key={type}
                  icon={TYPE_ICONS[type]}
                  title={label}
                  suffix={
                    <ToggleSwitch
                      isSelected={preferences[type]}
                      onValueChange={() => toggleType(type)}
                      disabled={typesDisabled}
                      aria-label={label}
                    />
                  }
                />
              ))}
            </div>
          </div>
        ) : null}

        {/* Reset */}
        <div className="pt-4 pb-6 px-4">
          <Button variant="outline" onClick={resetToDefaults}>
            {t("settings.notifications.reset")}
          </Button>
        </div>

      </div>
    </>
  );
}
