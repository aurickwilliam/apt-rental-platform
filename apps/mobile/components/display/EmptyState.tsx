import { View, Text } from "react-native";
import type { ReactNode } from "react";
import type { Icon } from "@tabler/icons-react-native";

import { useColors } from "@/hooks/useTheme";

const EMPTY_STATE_ICON_SIZE = 32;

interface EmptyStateProps {
  icon: Icon;
  title: string;
  description?: string;
  className?: string;
  /** Optional small button (HeroUI Native `Button size="sm"`). */
  action?: ReactNode;
  /** Icon color; defaults to the brand blue. Use sparingly (e.g. a success state). */
  iconColor?: string;
}

export default function EmptyState({
  icon: IconComponent,
  title,
  description,
  className,
  action,
  iconColor,
}: EmptyStateProps) {
  const { colors } = useColors();
  // A caller's own vertical padding (py-, pt-, pb-) replaces the default: conflicting
  // utilities are resolved by stylesheet order, not class order, so both can't be applied.
  const padding = /(^|\s)p[ytb]-/.test(className ?? "") ? "" : "py-10";

  return (
    <View className={`items-center justify-center gap-4 px-5 ${padding} ${className ?? ""}`}>
      <View className="bg-primary-light rounded-full p-5">
        <IconComponent size={EMPTY_STATE_ICON_SIZE} color={iconColor ?? colors.primary} />
      </View>
      <View className="items-center gap-1">
        <Text className="text-foreground text-lg font-nunitoBold text-center">
          {title}
        </Text>
        {description ? (
          <Text className="text-gray-500 text-sm font-inter text-center px-8">
            {description}
          </Text>
        ) : null}
      </View>
      {action ? <View className="mt-2">{action}</View> : null}
    </View>
  );
}
