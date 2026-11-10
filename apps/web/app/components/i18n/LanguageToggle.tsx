"use client";

import { Button } from "@heroui/react";
import { IconLanguage } from "@tabler/icons-react";

import { ALLOW_FILIPINO } from "@repo/i18n";

import { useTranslation } from "./LocaleProvider";

/**
 * One-click language switch, modelled on `ThemeToggle`. With exactly two
 * languages this is a toggle rather than a picker. The accessible name names
 * the destination, not the action, so screen-reader users know what they get.
 */
export default function LanguageToggle({
  /** `icon` fits a toolbar; `menu` is a full-width labeled row. */
  variant = "icon",
}: {
  variant?: "icon" | "menu";
}) {
  const { language, setLanguage, t } = useTranslation();

  if (!ALLOW_FILIPINO) return null;

  const next = language === "fil" ? "en" : "fil";
  const label =
    next === "fil"
      ? t("settings.languageSwitch.toFilipino")
      : t("settings.languageSwitch.toEnglish");
  const currentLabel = language === "fil" ? t("languages.fil") : t("languages.en");

  if (variant === "menu") {
    return (
      <Button
        variant="ghost"
        aria-label={label}
        className="w-full justify-start gap-2"
        onPress={() => setLanguage(next)}
      >
        <IconLanguage size={18} />
        <span>
          {t("common.language")} · {currentLabel}
        </span>
      </Button>
    );
  }

  return (
    <Button
      isIconOnly
      size="sm"
      variant="ghost"
      aria-label={label}
      onPress={() => setLanguage(next)}
    >
      <IconLanguage size={18} />
    </Button>
  );
}
