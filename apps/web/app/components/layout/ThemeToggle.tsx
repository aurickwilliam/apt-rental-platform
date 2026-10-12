"use client";

import { useTheme } from "next-themes";
import { Sun, Moon } from "lucide-react";
import { Button } from "@heroui/react";

import { useHydrated } from "@/hooks/use-hydrated";

export default function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  // The theme is only known in the browser; render a placeholder until then.
  const mounted = useHydrated();

  if (!mounted) {
    return <Button isIconOnly size="sm" variant="ghost" aria-label="Toggle theme" />;
  }

  return (
    <Button
      isIconOnly
      size="sm"
      variant="ghost"
      aria-label="Toggle theme"
      onPress={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
    >
      <span suppressHydrationWarning>
        {resolvedTheme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
      </span>
    </Button>
  );
}