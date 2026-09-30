"use client";

import { MessageSquare, Home, Wrench, CreditCard, Settings } from "lucide-react";
import {
  IconBell,
  IconBellRinging,
  IconCreditCard,
  IconHome,
  IconMessageCircle,
  IconSettings,
  IconTool,
} from "@tabler/icons-react";
import { Button, Spinner } from "@heroui/react";

import SettingsRow from "../SettingsRow";
import SectionTitle from "../SectionTitle";
import ToggleSwitch from "../ToggleSwitch";
import { useNotificationPreferences } from "../hooks/use-notification-prefs";

const LUCIDE_TYPE_ICONS: Record<string, React.ReactNode> = {
  payment: <CreditCard className="w-5 h-5" />,
  message: <MessageSquare className="w-5 h-5" />,
  maintenance: <Wrench className="w-5 h-5" />,
  apartment: <Home className="w-5 h-5" />,
  system: <Settings className="w-5 h-5" />,
};

const TABLER_TYPE_ICONS: Record<string, React.ReactNode> = {
  payment: <IconCreditCard size={20} aria-hidden="true" />,
  message: <IconMessageCircle size={20} aria-hidden="true" />,
  maintenance: <IconTool size={20} aria-hidden="true" />,
  apartment: <IconHome size={20} aria-hidden="true" />,
  system: <IconSettings size={20} aria-hidden="true" />,
};

const TABLER_GENERAL_ICONS: Record<string, React.ReactNode> = {
  notifications_enabled: <IconBell size={20} aria-hidden="true" />,
  push_enabled: <IconBellRinging size={20} aria-hidden="true" />,
  show_chat_toasts: <IconMessageCircle size={20} aria-hidden="true" />,
};

export default function NotificationsTab({
  isAdmin = false,
  iconSet = "lucide",
}: {
  isAdmin?: boolean;
  iconSet?: "lucide" | "tabler";
}) {
  const { preferences, loading, GENERAL_TOGGLES, NOTIFICATION_TYPE_LABELS, toggleGeneral, toggleType, resetToDefaults } = useNotificationPreferences();

  const typesDisabled = !preferences.notifications_enabled && !preferences.push_enabled;
  const TYPE_ICONS = iconSet === "tabler" ? TABLER_TYPE_ICONS : LUCIDE_TYPE_ICONS;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner color="accent" aria-label="Loading notifications" />
      </div>
    );
  }

  return (
    <>
      <h2 className="font-nunito text-lg font-bold text-primary">
        Notifications
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">
        {isAdmin
          ? "Manage delivery of administrator verification alerts and other updates."
          : "Manage how you receive updates."}
      </p>
      <div className="mt-3 divide-y divide-border">
        {isAdmin ? (
          <div>
            <div className="px-4 pb-3">
              <SectionTitle title="Verification alerts" />
            </div>
            <div className="divide-y divide-border">
              <SettingsRow
                icon={TYPE_ICONS.system}
                title="Verification alerts"
                description="Allow delivery of system alerts for new account and apartment verification submissions."
                suffix={
                  <ToggleSwitch
                    isSelected={preferences.system}
                    onValueChange={() => toggleType("system")}
                    disabled={typesDisabled}
                    aria-label="Verification alerts"
                  />
                }
              />
            </div>
            <p className="px-4 py-3 text-xs text-muted-foreground">
              This controls mobile banner and push delivery where
              available. Verification submissions still appear in
              the admin queue.
            </p>
          </div>
        ) : null}
        {/* General */}
        <div>
          <div className="px-4 pb-3">
            <SectionTitle title="General" />
          </div>
          <div className="divide-y divide-border">
            {GENERAL_TOGGLES.map(({ key, icon, title, description }) => (
              <SettingsRow
                key={key}
                icon={iconSet === "tabler" ? (TABLER_GENERAL_ICONS[key] ?? icon) : icon}
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

        {/* Notification Types */}
        <div className="pt-6">
          <div className="px-4 pb-3">
            <SectionTitle title="Notification Types" />
          </div>
          <p className="px-4 pb-3 text-sm text-muted-foreground">
            Per-type toggles are shared by both channels, so they only matter when at least one master is on.
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

        {/* Reset */}
        <div className="pt-4 pb-6 px-4">
          <Button variant="outline" onClick={resetToDefaults}>
            Reset to Defaults
          </Button>
        </div>

      </div>
    </>
  );
}
