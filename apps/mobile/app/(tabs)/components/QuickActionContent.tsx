import { Text, View } from "react-native";
import type { ComponentType } from "react";
import { useColors } from "hooks/useTheme";

interface QuickActionContentProps {
  label: string;
  icon: ComponentType<{ size?: number; color?: string; strokeWidth?: number }>;
  compact?: boolean;
  highlighted?: boolean;
  badgeCount?: number;
}

/** The same icon tile and caption in the dashboard and customization preview. */
export default function QuickActionContent({
  label,
  icon: Icon,
  compact = true,
  highlighted = false,
  badgeCount,
}: QuickActionContentProps) {
  const { colors } = useColors();

  return (
    <View className="w-full items-center gap-1.5">
      <View className={`relative ${compact ? "size-12 rounded-xl" : "size-14 rounded-2xl"} ${highlighted ? "bg-accent/10 border border-accent" : "bg-surface-tertiary"} justify-center items-center`}>
        <Icon size={compact ? 20 : 22} color={colors.gray500} strokeWidth={2} />
        {(badgeCount ?? 0) > 0 && (
          <View className="absolute -top-1 -right-1 min-w-5.5 h-5.5 px-1 rounded-full bg-accent items-center justify-center border-2 border-background">
            <Text className="text-white text-[10px] font-nunitoSemiBold">
              {badgeCount && badgeCount > 9 ? "9+" : badgeCount}
            </Text>
          </View>
        )}
      </View>
      <Text numberOfLines={2} className="h-8 text-center text-[12px] leading-4 text-foreground font-inter">
        {label}
      </Text>
    </View>
  );
}
