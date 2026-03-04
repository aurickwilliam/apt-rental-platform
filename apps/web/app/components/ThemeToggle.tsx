"use client";

import { useTheme } from "next-themes";
import { Button } from "@heroui/button";

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <Button
      variant="flat"
      color="primary"
      radius="full"
      onPress={() => setTheme(theme === "dark" ? "light" : "dark")}
    >
      {theme === "dark" ? "Light Mode" : "Dark Mode"}
    </Button>
  );
}
