import { View, Text, TouchableOpacity } from "react-native";
import { IconChevronRight } from "@tabler/icons-react-native";

import { useColors } from "@/hooks/useTheme";

interface DashboardStatTileProps {
  label: string;
  value: string;
  caption?: string;
  /** Highlights the value in the danger color (e.g. overdue rent). */
  isAlert?: boolean;
  /** Paints the label in the brand color instead of the muted default. */
  isLabelAccented?: boolean;
  /** Omit for informational tiles. */
  onPress?: () => void;
}

export default function DashboardStatTile({
  label,
  value,
  caption,
  isAlert = false,
  isLabelAccented = false,
  onPress,
}: DashboardStatTileProps) {
  const { colors } = useColors();

  const content = (
    <>
      <View className="flex-row items-center justify-between">
        <Text className={`text-sm flex-1 ${isLabelAccented ? "text-primary font-nunitoSemiBold" : "text-muted font-interMedium"}`}>{label}</Text>
        {onPress ? <IconChevronRight size={16} color={colors.gray500} /> : null}
      </View>
      <Text
        className={`text-3xl font-nunitoBold ${isAlert ? "text-danger" : "text-foreground"}`}
        numberOfLines={1}
        adjustsFontSizeToFit
      >
        {value}
      </Text>
      {caption ? (
        <Text className="text-xs text-muted font-inter" numberOfLines={1}>
          {caption}
        </Text>
      ) : null}
    </>
  );

  const className =
    "flex-1 bg-surface rounded-3xl p-4 gap-1 border border-border justify-center";

  if (!onPress) {
    return <View className={className}>{content}</View>;
  }

  return (
    <TouchableOpacity
      className={className}
      activeOpacity={0.7}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${label}, ${value}${caption ? `, ${caption}` : ""}`}
    >
      {content}
    </TouchableOpacity>
  );
}
