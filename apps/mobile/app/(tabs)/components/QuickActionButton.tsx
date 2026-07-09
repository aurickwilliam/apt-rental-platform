import { TouchableOpacity, Text, View } from "react-native";

import { LucideIcon } from "lucide-react-native";

import { useColors } from "hooks/useTheme";

interface QuickActionButtonProps {
  label: string;
  icon: LucideIcon;
  onPress?: () => void;
  badgeCount?: number;
}

export default function QuickActionButton({
  label,
  icon: Icon,
  onPress,
  badgeCount,
}: QuickActionButtonProps) {
  const { colors } = useColors();

  return (
    <View className="w-1/4 px-2 mb-4">
      <TouchableOpacity
        className="flex items-center justify-center gap-2"
        onPress={onPress}
        activeOpacity={0.7}
      >
        {/* Icon Label */}
        <View className="relative aspect-square p-4 bg-surface-tertiary justify-center items-center rounded-2xl">
          <Icon
            size={26}
            color={colors.gray500}
            strokeWidth={2}
          />

          {/* Badge Count */}
          {(badgeCount ?? 0) > 0 && (
            <View className="absolute -top-1 -right-1 min-w-5.5 h-5.5 px-1 rounded-full bg-accent items-center justify-center border-2 border-background">
              <Text className="text-white text-[10px] font-interSemiBold">
                {badgeCount && badgeCount > 9 ? "9+" : badgeCount}
              </Text>
            </View>
          )}
        </View>

        {/* Text Label */}
        <Text className="text-center text-[12px] text-foreground font-inter">
          {label}
        </Text>
      </TouchableOpacity>
    </View>
  );
}
