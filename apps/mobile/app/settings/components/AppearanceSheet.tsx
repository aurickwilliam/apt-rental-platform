import { View, Text } from "react-native";
import {
  BottomSheet,
  Description,
  Label,
  Radio,
  RadioGroup,
} from "heroui-native";

import { IconDeviceMobile, IconMoonStars, IconSun } from "@tabler/icons-react-native";
import type { Icon } from "@tabler/icons-react-native";

import { translate, type LanguageCode, type TranslationKey } from "@repo/i18n";

import { useTranslation } from "@/hooks/i18n/useTranslation";
import { useColors } from "@/hooks/useTheme";
import type { ThemeMode } from "@/stores/useThemeStore";

export const THEME_MODE_OPTIONS: {
  value: ThemeMode;
  labelKey: TranslationKey;
  descriptionKey: TranslationKey;
  icon: Icon;
}[] = [
  {
    value: "system",
    labelKey: "settings.theme.system",
    descriptionKey: "settings.mobile.appearance.system.description",
    icon: IconDeviceMobile,
  },
  {
    value: "light",
    labelKey: "settings.theme.light",
    descriptionKey: "settings.mobile.appearance.light.description",
    icon: IconSun,
  },
  {
    value: "dark",
    labelKey: "settings.theme.dark",
    descriptionKey: "settings.mobile.appearance.dark.description",
    icon: IconMoonStars,
  },
];

export function getThemeModeLabel(mode: ThemeMode, language: LanguageCode = "en") {
  const option =
    THEME_MODE_OPTIONS.find((candidate) => candidate.value === mode) ??
    THEME_MODE_OPTIONS[0];
  return translate(language, option.labelKey);
}

function isThemeMode(value: string): value is ThemeMode {
  return THEME_MODE_OPTIONS.some((option) => option.value === value);
}

interface AppearanceSheetProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  themeMode: ThemeMode;
  onSelect: (mode: ThemeMode) => void;
}

export default function AppearanceSheet({
  isOpen,
  onOpenChange,
  themeMode,
  onSelect,
}: AppearanceSheetProps) {
  const { colors } = useColors();
  const { t } = useTranslation();

  const handleChange = (value: string) => {
    if (!isThemeMode(value)) return;
    onSelect(value);
    onOpenChange(false);
  };

  return (
    <BottomSheet isOpen={isOpen} onOpenChange={onOpenChange}>
      <BottomSheet.Portal>
        <BottomSheet.Overlay />
        <BottomSheet.Content>
          <Text className="text-lg text-center text-foreground font-nunitoSemiBold border-b border-border pb-3 mb-4">
            {t("settings.mobile.appearance")}
          </Text>

          <RadioGroup
            value={themeMode}
            onValueChange={handleChange}
            className="gap-2 pb-6"
          >
            {THEME_MODE_OPTIONS.map((option) => {
              const label = t(option.labelKey);
              const description = t(option.descriptionKey);
              return (
                <RadioGroup.Item
                  key={option.value}
                  value={option.value}
                  accessibilityLabel={`${label}. ${description}`}
                  className={`flex-row items-center justify-between p-4 min-h-14 rounded-2xl ${
                    option.value === themeMode ? "bg-accent/10" : "bg-surface"
                  }`}
                >
                  <option.icon
                    size={22}
                    color={
                      option.value === themeMode
                        ? colors.primary
                        : colors.textPrimary
                    }
                  />
                  <View className="flex-1 px-3">
                    <Label>{label}</Label>
                    <Description className="font-inter">
                      {description}
                    </Description>
                  </View>
                  <Radio>
                    <Radio.Indicator className="border border-border shadow-none rounded-full" />
                  </Radio>
                </RadioGroup.Item>
              );
            })}
          </RadioGroup>
        </BottomSheet.Content>
      </BottomSheet.Portal>
    </BottomSheet>
  );
}
