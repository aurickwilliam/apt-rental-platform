"use client";

import { useSyncExternalStore } from "react";
import {
  IconDeviceDesktop,
  IconMoon,
  IconPlayerPause,
  IconSun,
} from "@tabler/icons-react";
import { useTheme } from "next-themes";

import SettingsRow from "../SettingsRow";
import SettingsSelect from "../SettingsSelect";
import ToggleSwitch from "../ToggleSwitch";
import {
  getReducedMotion,
  setReducedMotion,
  subscribeReducedMotion,
} from "@/lib/reduced-motion";

type ThemeMode = "light" | "system" | "dark";

const THEME_OPTIONS = [
  { value: "light", label: "Light", icon: IconSun },
  { value: "system", label: "System", icon: IconDeviceDesktop },
  { value: "dark", label: "Dark", icon: IconMoon },
] as const;

export default function GeneralTab() {
  const { theme, setTheme } = useTheme();
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
  const reduceMotion = useSyncExternalStore(
    subscribeReducedMotion,
    getReducedMotion,
    () => false,
  );

  const activeTheme: ThemeMode = mounted && (theme === "dark" || theme === "system") ? theme : "light";

  const ThemeIcon = THEME_OPTIONS.find(({ value }) => value === activeTheme)!.icon;

  return (
    <>
      <h2 className="font-nunito text-lg font-bold text-primary">General</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Appearance settings for this browser.
      </p>
      <div className="mt-3 divide-y divide-border">
        <SettingsRow
          icon={<ThemeIcon size={18} />}
          title="Theme"
          description="Choose light, dark, or follow your device."
          suffix={
            <SettingsSelect
              label="Theme"
              value={activeTheme}
              options={THEME_OPTIONS.map(({ value, label, icon }) => ({ value, label, icon }))}
              onChange={setTheme}
              isDisabled={!mounted}
            />
          }
        />
        <SettingsRow
          icon={<IconPlayerPause size={18} />}
          title="Reduce motion"
          description="Limit animations on this browser."
          suffix={
            <ToggleSwitch
              isSelected={reduceMotion}
              onValueChange={setReducedMotion}
              aria-label="Reduce motion"
            />
          }
        />
      </div>
    </>
  );
}
