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

import { useColors } from "@/hooks/useTheme";
import type { ThemeMode } from "@/stores/useThemeStore";

export const THEME_MODE_OPTIONS: {
  value: ThemeMode;
  label: string;
  description: string;
  icon: Icon;
}[] = [
  {
    value: "system",
    label: "System",
    description: "Match your device settings",
    icon: IconDeviceMobile,
  },
  {
    value: "light",
    label: "Light",
    description: "Always use the light theme",
    icon: IconSun,
  },
  {
    value: "dark",
    label: "Dark",
    description: "Always use the dark theme",
    icon: IconMoonStars,
  },
];

export function getThemeModeLabel(mode: ThemeMode) {
  return (
    THEME_MODE_OPTIONS.find((option) => option.value === mode)?.label ??
    "System"
  );
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
            Appearance
          </Text>

          <RadioGroup
            value={themeMode}
            onValueChange={handleChange}
            className="gap-2 pb-6"
          >
            {THEME_MODE_OPTIONS.map((option) => (
              <RadioGroup.Item
                key={option.value}
                value={option.value}
                accessibilityLabel={`${option.label}. ${option.description}`}
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
                  <Label>{option.label}</Label>
                  <Description className="font-inter">
                    {option.description}
                  </Description>
                </View>
                <Radio>
                  <Radio.Indicator className="border border-border shadow-none rounded-full" />
                </Radio>
              </RadioGroup.Item>
            ))}
          </RadioGroup>
        </BottomSheet.Content>
      </BottomSheet.Portal>
    </BottomSheet>
  );
}
