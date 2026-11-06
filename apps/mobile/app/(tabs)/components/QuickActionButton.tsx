import { TouchableOpacity, View } from "react-native";
import type React from "react";

import { registerTutorialTarget } from "@/components/tutorial/targetRegistry";
import QuickActionContent from "./QuickActionContent";

interface QuickActionButtonProps {
  label: string;
  icon: React.ComponentType<{ size?: number; color?: string; strokeWidth?: number }>;
  onPress?: () => void;
  badgeCount?: number;
  columns?: 4 | 5;
  /** Stable first-time tutorial key (see `TUTORIAL_TARGETS` in `@repo/utils`). */
  tourKey?: string;
}

export default function QuickActionButton({
  label,
  icon: Icon,
  onPress,
  badgeCount,
  columns = 4,
  tourKey,
}: QuickActionButtonProps) {
  const isFiveColumnLayout = columns === 5;

  return (
    <View
      ref={tourKey ? (view) => registerTutorialTarget(tourKey, view) : undefined}
      className={`${columns === 5 ? "w-1/5" : "w-1/4 mb-3"} px-1`}
    >
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
