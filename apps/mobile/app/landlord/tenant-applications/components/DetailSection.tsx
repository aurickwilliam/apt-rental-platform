import type { ReactNode } from "react";
import { Text, View } from "react-native";

import type { Icon } from "@tabler/icons-react-native";

import { useColors } from "@/hooks/useTheme";

interface DetailSectionProps {
  title: string;
  icon: Icon;
  children: ReactNode;
}

/** Card-style section: surface, hairline border, rounded-3xl, p-4 (DESIGN.md §11). */
export default function DetailSection({
  title,
  icon: SectionIcon,
  children,
}: DetailSectionProps) {
  const { colors } = useColors();

  return (
    <View className="bg-surface border border-border rounded-3xl p-4 gap-4">
      <View className="flex-row items-center gap-2">
        <SectionIcon size={22} color={colors.primary} />
        <Text className="text-foreground text-lg font-nunitoSemiBold">
          {title}
        </Text>
      </View>
      {children}
    </View>
  );
}
