"use client";

import { useTheme } from "next-themes";
import { Button } from "@heroui/button";

import { Sun, Moon } from "lucide-react";

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <>
      {
        theme === "dark" ? (
          <Button
            isIconOnly
            variant="light"
            radius="full"
            onPress={() => setTheme("light")}
          >
            <Sun size={18} />
          </Button>
        ) : (
          <Button
            isIconOnly
            variant="light"
            radius="full"
            onPress={() => setTheme("dark")}
          >
            <Moon size={18} />
          </Button>
        )
      } 
    </>
  );
}
