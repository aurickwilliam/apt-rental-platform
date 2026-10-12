"use client";

import { useSyncExternalStore } from "react";
import {
  IconDeviceDesktop,
  IconMoon,
  IconPlayerPause,
  IconSun,
} from "@tabler/icons-react";
import { ListBox, Select } from "@heroui/react";
import { useTheme } from "next-themes";

import SettingsRow from "../SettingsRow";
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
            <Select
              aria-label="Theme"
              value={activeTheme}
              isDisabled={!mounted}
              onChange={(key) => {
                if (key) setTheme(String(key));
              }}
              className="w-40"
            >
              <Select.Trigger className="cursor-pointer border-border bg-background! text-foreground hover:bg-muted!">
                <Select.Value />
                <Select.Indicator />
              </Select.Trigger>
              <Select.Popover>
                <ListBox>
                  {THEME_OPTIONS.map(({ value, label, icon: Icon }) => (
                    <ListBox.Item key={value} id={value} textValue={label}>
                      <span className="flex flex-row items-center gap-2">
                        <Icon size={16} aria-hidden="true" />
                        {label}
                      </span>
                    </ListBox.Item>
                  ))}
                </ListBox>
              </Select.Popover>
            </Select>
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
