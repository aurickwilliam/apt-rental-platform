"use client";

import { MessageSquare, Home, Wrench, CreditCard, Settings } from "lucide-react";
import { Button, Spinner } from "@heroui/react";

import SettingsShell from "../components/SettingsShell";
import SettingsRow from "../components/SettingsRow";
import SectionTitle from "../components/SectionTitle";
import ToggleSwitch from "../components/ToggleSwitch";
import { useNotificationPreferences } from "../hooks/use-notification-prefs";

const TYPE_ICONS: Record<string, React.ReactNode> = {
  payment: <CreditCard className="w-5 h-5" />,
  message: <MessageSquare className="w-5 h-5" />,
  maintenance: <Wrench className="w-5 h-5" />,
  apartment: <Home className="w-5 h-5" />,
  system: <Settings className="w-5 h-5" />,
};

export default function NotificationSettingsPage() {
  const { preferences, loading, GENERAL_TOGGLES, NOTIFICATION_TYPE_LABELS, toggleGeneral, toggleType, resetToDefaults } = useNotificationPreferences();

  const typesDisabled = !preferences.notifications_enabled && !preferences.push_enabled;

  if (loading) {
    return (
      <SettingsShell title="Notifications" showBack>
        <div className="flex items-center justify-center h-64">
          <Spinner color="accent" aria-label="Loading notifications" />
        </div>
      </SettingsShell>
    );
  }

  return (
    <SettingsShell title="Notifications" showBack>
      <div className="p-4 sm:p-5 divide-y divide-border">
        {/* General */}
        <div>
          <div className="px-4 pb-3">
            <SectionTitle title="General" />
          </div>
          <div className="divide-y divide-border">
            {GENERAL_TOGGLES.map(({ key, icon, title, description }) => (
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
    </SettingsShell>
  );
}