import { View, Text, TouchableOpacity } from "react-native";

import {
  IconCalendarEvent,
  IconChevronRight,
  IconFileDescription,
  IconTool,
} from "@tabler/icons-react-native";

import { useColors } from "@/hooks/useTheme";

import type { RequestItem } from "@/service/dashboard/dashboardService";

const ROWS = {
  applications: { Icon: IconFileDescription, singular: "new application" },
  visits: { Icon: IconCalendarEvent, singular: "visit request" },
  maintenance: { Icon: IconTool, singular: "new maintenance request" },
} as const;

interface NewRequestsCardProps {
  items: RequestItem[];
  onPressItem: (item: RequestItem) => void;
}

export default function NewRequestsCard({ items, onPressItem }: NewRequestsCardProps) {
  const { colors } = useColors();

  return (
    <View className="bg-surface rounded-3xl border border-border p-4 gap-3">
      <Text className="text-accent font-nunitoBold text-xl">Waiting for your reply</Text>

      {items.map((item) => {
        const { Icon, singular } = ROWS[item.key];
        const title = `${item.count} ${singular}${item.count === 1 ? "" : "s"}`;

        return (
          <TouchableOpacity
            key={item.key}
            className="flex-row items-center gap-3"
            activeOpacity={0.7}
            onPress={() => onPressItem(item)}
            accessibilityRole="button"
            accessibilityLabel={title}
          >
            <View className="rounded-full p-2 bg-primary-light">
              <Icon size={20} color={colors.primaryLightForeground} />
            </View>
            <Text className="text-foreground font-nunitoSemiBold flex-1">{title}</Text>
            <IconChevronRight size={18} color={colors.gray500} />
          </TouchableOpacity>
        );
      })}
    </View>
  );
}
