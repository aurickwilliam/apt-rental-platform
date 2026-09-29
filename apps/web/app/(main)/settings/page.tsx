"use client";

import { useSyncExternalStore } from "react";
import { Key, Mail, Globe, Bell, Moon, Sun, AlertCircle, HelpCircle, FileText, Shield, Users, Settings } from "lucide-react";

import SettingsRow from "./components/SettingsRow";
import SectionTitle from "./components/SectionTitle";
import ComingSoonChip from "./components/ComingSoonChip";
import ToggleSwitch from "./components/ToggleSwitch";
import SettingsShell from "./components/SettingsShell";
import { useTheme } from "next-themes";
import { useUserPreferences } from "./hooks/use-rental-preferences";
import { useNotificationPreferences } from "./hooks/use-notification-prefs";

interface SettingItem {
  icon: React.ReactNode;
  title: string;
  description?: string;
  suffix?: React.ReactNode;
  href?: string;
  onClick?: () => void;
  disabled?: boolean;
}

interface SettingSection {
  title: string;
  items: SettingItem[];
}

export default function SettingsHub() {
  const { resolvedTheme, setTheme } = useTheme();
  // Client-only flag without set-state-in-effect (avoids hydration mismatch on theme).
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  const { preferences: rentalPrefs, hasPrefs } = useUserPreferences();
  const { preferences: notifPrefs } = useNotificationPreferences();

  const notificationSummary =
    notifPrefs.notifications_enabled && notifPrefs.push_enabled
      ? "On"
      : !notifPrefs.notifications_enabled && !notifPrefs.push_enabled
        ? "Off"
        : "Partial";

  const rentalSummary = (() => {
    if (!rentalPrefs || !hasPrefs) return "Not set";
    const cities = rentalPrefs.selectedCities;
    const cityPart = cities.length > 0
      ? cities.slice(0, 2).join(", ") + (cities.length > 2 ? ` +${cities.length - 2}` : "")
      : "CAMANAVA";
    return `${cityPart} · ₱${rentalPrefs.budgetMin.toLocaleString()}–${rentalPrefs.budgetMax.toLocaleString()}`;
  })();

  const toggleTheme = () => {
    setTheme(resolvedTheme === "dark" ? "light" : "dark");
  };

  const sections: SettingSection[] = [
    {
      title: "Security",
      items: [
        {
          icon: <Key size={18} />,
          title: "Change Password",
          disabled: true,
          suffix: <ComingSoonChip />,
        },
        {
          icon: <Mail size={18} />,
          title: "Change Email",
          disabled: true,
          suffix: <ComingSoonChip />,
        },
      ],
    },
    {
      title: "Preferences",
      items: [
        {
          icon: <Settings size={18} />,
          title: "Rental Preferences",
          href: "/settings/preferences",
          suffix: (
            <span className="text-muted-foreground text-sm font-inter truncate max-w-[200px]">
              {rentalSummary}
            </span>
          ),
        },
        {
          icon: <Globe size={18} />,
          title: "Language & Region",
          disabled: true,
          suffix: <ComingSoonChip />,
        },
        {
          icon: <Bell size={18} />,
          title: "Notifications",
          href: "/settings/notifications",
          suffix: (
            <span className="text-muted-foreground text-sm font-inter">
              {notificationSummary}
            </span>
          ),
        },
        {
          icon: mounted && resolvedTheme === "dark" ? <Moon size={18} /> : <Sun size={18} />,
          title: "Dark Mode",
          suffix: (
            <ToggleSwitch
              isSelected={mounted && resolvedTheme === "dark"}
              onValueChange={toggleTheme}
              disabled={!mounted}
              aria-label="Toggle dark mode"
            />
          ),
        },
      ],
    },
    {
      title: "Help & Support",
      items: [
        {
          icon: <AlertCircle size={18} />,
          title: "Report a Problem",
          disabled: true,
          suffix: <ComingSoonChip />,
        },
        {
          icon: <HelpCircle size={18} />,
          title: "FAQs",
          href: "/settings/faq",
        },
        {
          icon: <FileText size={18} />,
          title: "Terms and Conditions",
          href: "/settings/terms",
        },
        {
          icon: <Shield size={18} />,
          title: "Privacy Policy",
          href: "/settings/privacy-policy",
        },
        {
          icon: <Users size={18} />,
          title: "About Us",
          href: "/settings/about",
        },
      ],
    },
  ];

  return (
    <SettingsShell title="Settings" subtitle="Manage your account, preferences, and privacy">
      <div className="p-4 sm:p-5 divide-y divide-border">
        {sections.map((section, sIndex) => (
          <div key={section.title} className={sIndex > 0 ? "pt-6" : ""}>
            <div className="px-4 pb-3">
              <SectionTitle title={section.title} />
            </div>
            <div className="divide-y divide-border">
              {section.items.map((item) => (
                <SettingsRow
                  key={item.title}
                  icon={item.icon}
                  title={item.title}
                  description={item.description}
                  suffix={item.suffix}
                  disabled={item.disabled}
                  href={item.href}
                  onClick={item.onClick}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </SettingsShell>
  );
}