"use client";

import { BellRing } from "lucide-react";
import { Button } from "@heroui/react";

import SettingsShell from "../components/SettingsShell";
import SettingsRow from "../components/SettingsRow";
import SectionTitle from "../components/SectionTitle";
import ToggleSwitch from "../components/ToggleSwitch";
import { useNotificationPreferences } from "../hooks/use-notification-prefs";

export default function NotificationSettingsPage() {
  const { preferences, loading, GENERAL_TOGGLES, NOTIFICATION_TYPE_LABELS, toggleGeneral, toggleType, resetToDefaults } = useNotificationPreferences();

  const typesDisabled = !preferences.notifications_enabled && !preferences.push_enabled;

  if (loading) {
    return (
      <SettingsShell title="Notifications" showBack>
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </SettingsShell>
    );
  }

  return (
    <SettingsShell title="Notifications" showBack>
      <div className="p-4 sm:p-5 divide-y divide-border">
        {/* General */}
        <div className="pt-6">
          <div className="px-4 sm:px-5 pb-3">
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
                    disabled={loading}
                  />
                }
              />
            ))}
          </div>
        </div>

        {/* Notification Types */}
        <div className="pt-6">
          <div className="px-4 sm:px-5 pb-3">
            <SectionTitle title="Notification Types" />
          </div>
          <p className="px-4 sm:px-5 text-sm text-muted-foreground">
            Per-type toggles are shared by both channels, so they only matter when at least one master is on.
          </p>
          <div className="divide-y divide-border">
            {NOTIFICATION_TYPE_LABELS.map(({ type, label }) => (
              <SettingsRow
                key={type}
                icon={
                  <span className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                    <BellRing className="w-5 h-5" />
                  </span>
                }
                title={label}
                suffix={
                  <ToggleSwitch
                    isSelected={preferences[type]}
                    onValueChange={() => toggleType(type)}
                    disabled={typesDisabled || loading}
                  />
                }
              />
            ))}
          </div>
        </div>

        {/* Reset */}
        <div className="pt-4 pb-6 px-4 sm:px-5">
          <Button variant="outline" onClick={resetToDefaults}>
            Reset to Defaults
          </Button>
        </div>

      </div>
    </SettingsShell>
  );
}