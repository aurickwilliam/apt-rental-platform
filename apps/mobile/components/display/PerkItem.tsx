import { Text, View } from "react-native";

import { PERKS } from "constants/perks";

import { useColors } from "hooks/useTheme";

import { LucideIcon, CircleQuestionMark } from "lucide-react-native";

type BasePerkItemProps = {
  iconColor?: string;
  iconSize?: number;
  textSize?: number;
};

type PerkItemProps = BasePerkItemProps &
  (
    | {
        perkId: string;
        customIcon?: never;
        customText?: never;
      }
    | {
        perkId?: never;
        customIcon: LucideIcon;
        customText: string;
      }
  );

export default function PerkItem({
  iconColor,
  iconSize = 26,
  textSize = 16,
  ...props
}: PerkItemProps) {
  const { colors } = useColors();

  const perk =
    "perkId" in props && props.perkId ? PERKS[props.perkId] : undefined;
  iconColor = iconColor || colors.primary;

  // Icon and text with fallbacks
  const Icon =
    ("customIcon" in props ? props.customIcon : undefined) ||
    perk?.icon ||
    CircleQuestionMark;
  const text =
    ("customText" in props ? props.customText : undefined) ||
    perk?.name ||
    "Unknown perk";

  return (
    <View className="flex-row items-center gap-3">
      {Icon && <Icon size={iconSize} color={iconColor} />}
      <Text
        className="text-foreground text-sm font-inter mt-1"
        style={{ fontSize: textSize }}
      >
        {text}
      </Text>
    </View>
  );
}
