import { Text, TouchableOpacity } from "react-native";

import { PERKS } from "constants/perks";

import {
  LucideIcon,
  CircleX,
  CircleQuestionMark,
} from 'lucide-react-native';

import { useColors } from "@/hooks/useTheme";

type BasePerkButtonProps = {
  iconColor?: string;
  iconSize?: number;
  textSize?: number;
};

type PerkButtonProps = BasePerkButtonProps &
  (
    | {
        perkId: string;
        customIcon?: never;
        customText?: never;
        isSelected?: boolean;
        onPress?: () => void;
        onRemovePress?: () => void;
      }
    | {
        perkId?: never;
        customIcon: LucideIcon;
        customText: string;
        isSelected?: never;
        onPress?: () => void;
        onRemovePress?: () => void;
      }
  );

export default function PerkButton({
  iconColor,
  iconSize = 26,
  textSize = 16,
  ...props
}: PerkButtonProps) {
  const { colors } = useColors();

  iconColor = iconColor || colors.primary;
  const perk =
    "perkId" in props && props.perkId ? PERKS[props.perkId] : undefined;

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
    <TouchableOpacity
      className="flex-row items-center justify-center gap-2 bg-surface border border-border py-2 px-4 rounded-full"
      onPress={props.onPress}
      activeOpacity={0.7}
    >
      {Icon && <Icon size={iconSize} color={iconColor} />}
      <Text
        className="text-foreground text-base font-inter mt-1"
        style={{ fontSize: textSize }}
      >
        {text}
      </Text>

      {props.isSelected && (
        <TouchableOpacity onPress={props.onRemovePress ?? props.onPress}>
          <CircleX size={22} color={colors.gray500} />
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
}
