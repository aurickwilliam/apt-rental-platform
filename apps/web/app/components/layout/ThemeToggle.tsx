"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Sun, Moon } from "lucide-react";
import { Button } from "@heroui/react";

export default function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

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