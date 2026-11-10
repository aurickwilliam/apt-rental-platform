"use client";

import { useTheme } from "next-themes";
import { IconSun as Sun, IconMoon as Moon } from "@tabler/icons-react";
import { Button } from "@heroui/react";

import { useHydrated } from "@/hooks/use-hydrated";
import { useTranslation } from "@/app/components/i18n/LocaleProvider";

export default function ThemeToggle() {
  const { t } = useTranslation();
  const { resolvedTheme, setTheme } = useTheme();
  // The theme is only known in the browser; render a placeholder until then.
  const mounted = useHydrated();

  if (!mounted) {
    return <Button isIconOnly size="sm" variant="ghost" aria-label={t("common.toggleTheme")} />;
  }

  return (
    <Button
      isIconOnly
      size="sm"
      variant="ghost"
      aria-label={t("common.toggleTheme")}
      onPress={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
    >
      <span suppressHydrationWarning>
        {resolvedTheme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
      </span>
    </Button>
  );
}