"use client";

import { useTheme } from "next-themes";
import { Button } from "@heroui/react";
import { Sun, Moon } from "lucide-react";

export default function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();

  return (
    <Button
      isIconOnly
      variant="ghost"
      onPress={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
    >
      <span suppressHydrationWarning>
        {resolvedTheme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
      </span>
    </Button>
  );
}