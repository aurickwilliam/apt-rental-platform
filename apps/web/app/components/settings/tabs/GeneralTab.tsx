"use client";

import { useSyncExternalStore } from "react";
import { Moon, Sun } from "lucide-react";
import { IconMoon, IconSun } from "@tabler/icons-react";
import { useTheme } from "next-themes";

import SettingsRow from "../SettingsRow";
import ToggleSwitch from "../ToggleSwitch";
import {
  getReducedMotion,
  setReducedMotion,
  subscribeReducedMotion,
} from "@/lib/reduced-motion";

export default function GeneralTab({
  iconSet = "lucide",
}: {
  iconSet?: "lucide" | "tabler";
}) {
  const { resolvedTheme, setTheme } = useTheme();
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

  const toggleTheme = () => {
    setTheme(resolvedTheme === "dark" ? "light" : "dark");
  };

  const isDark = mounted && resolvedTheme === "dark";
  const DarkIcon = iconSet === "tabler" ? (isDark ? IconMoon : IconSun) : isDark ? Moon : Sun;
  const MotionIcon = iconSet === "tabler" ? IconSun : Sun;

  return (
    <>
      <h2 className="font-nunito text-lg font-bold text-primary">General</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Appearance settings for this browser.
      </p>
      <div className="mt-3 divide-y divide-border">
        <SettingsRow
          icon={<DarkIcon size={18} />}
          title="Dark Mode"
          description="Use a darker color theme on this browser."
          suffix={
            <ToggleSwitch
              isSelected={isDark}
              onValueChange={toggleTheme}
              disabled={!mounted}
              aria-label="Toggle dark mode"
            />
          }
        />
        <SettingsRow
          icon={<MotionIcon size={18} />}
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
