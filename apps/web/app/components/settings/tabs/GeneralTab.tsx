"use client";

import { useSyncExternalStore } from "react";
import {
  IconDeviceDesktop,
  IconLanguage,
  IconMapPin,
  IconMoon,
  IconPlayerPause,
  IconSun,
} from "@tabler/icons-react";
import { useTheme } from "next-themes";

import { ALLOW_FILIPINO, isLanguageCode } from "@repo/i18n";

import { useTranslation } from "@/app/components/i18n/LocaleProvider";
import ComingSoonChip from "../ComingSoonChip";
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
  const { language, setLanguage, t } = useTranslation();
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

  const languageOptions = [
    { value: "en" as const, label: t("languages.en") },
    { value: "fil" as const, label: t("languages.fil") },
  ];

  return (
    <>
      <h2 className="font-nunito text-lg font-bold text-primary">{t("settings.general")}</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        {t("settings.general.description")}
      </p>

      {/* Language and Region stay grouped apart from Appearance. Region is an
          intentional disabled stub: the feature is planned but not built, so
          it explains itself with a chip instead of pretending to work. */}
      {ALLOW_FILIPINO ? (
        <section className="mt-5" aria-labelledby="settings-language-region-heading">
          <h3
            id="settings-language-region-heading"
            className="px-4 font-nunito text-xs font-semibold uppercase tracking-wide text-muted-foreground"
          >
            {t("settings.languageRegion.heading")}
          </h3>
          <div className="mt-2 divide-y divide-border">
            <SettingsRow
              icon={<IconLanguage size={18} />}
              title={t("settings.language.title")}
              description={t("settings.language.description")}
              suffix={
                <SettingsSelect
                  label={t("settings.language.label")}
                  value={language}
                  options={languageOptions}
                  onChange={(value) => {
                    if (isLanguageCode(value)) setLanguage(value);
                  }}
                />
              }
            />
            <SettingsRow
              icon={<IconMapPin size={18} />}
              title={t("settings.region.title")}
              description={t("settings.region.description")}
              disabled
              suffix={<ComingSoonChip />}
            />
          </div>
        </section>
      ) : null}

      <div className="mt-3 divide-y divide-border">
        <SettingsRow
          icon={<ThemeIcon size={18} />}
          title="Theme"
          responsiveLayout="stack-control"
          description={t("settings.theme.description")}
          suffix={
            <SettingsSelect
              label={t("settings.theme.label")}
              value={activeTheme}
              options={THEME_OPTIONS.map(({ value, label, icon }) => ({ value: t(`settings.theme.${value}`), label, icon }))}
              onChange={setTheme}
              isDisabled={!mounted}
              className="w-full min-w-0 sm:w-40"
            />
          }
        />
        <SettingsRow
          icon={<IconPlayerPause size={18} />}
          title="Reduce motion"
          responsiveLayout="wrap"
          description={t("settings.reduceMotion.description")}
          suffix={
            <ToggleSwitch
              isSelected={reduceMotion}
              onValueChange={setReducedMotion}
              aria-label={t("settings.reduceMotion.label")}
            />
          }
        />
      </div>
    </>
  );
}
