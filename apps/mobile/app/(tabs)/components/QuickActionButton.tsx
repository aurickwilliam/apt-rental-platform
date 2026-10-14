import { TouchableOpacity, View } from "react-native";
import type React from "react";

import QuickActionContent from "./QuickActionContent";

interface QuickActionButtonProps {
  label: string;
  icon: React.ComponentType<{ size?: number; color?: string; strokeWidth?: number }>;
  onPress?: () => void;
  badgeCount?: number;
  columns?: 4 | 5;
}

export default function QuickActionButton({
  label,
  icon: Icon,
  onPress,
  badgeCount,
  columns = 4,
}: QuickActionButtonProps) {
  const isFiveColumnLayout = columns === 5;

  return (
    <View className={`${columns === 5 ? "w-1/5" : "w-1/4"} px-1 mb-3`}>
      <TouchableOpacity
        className="flex items-center justify-center gap-1.5"
        onPress={onPress}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel={label}
      >
        <QuickActionContent label={label} icon={Icon} compact={isFiveColumnLayout} badgeCount={badgeCount} />
      </TouchableOpacity>
    </View>
  );
}
