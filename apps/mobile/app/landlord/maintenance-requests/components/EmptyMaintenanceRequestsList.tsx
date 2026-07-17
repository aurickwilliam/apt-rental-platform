import { View, Text } from "react-native";

import { IconHammer } from "@tabler/icons-react-native";

import { useColors } from "@/hooks/useTheme";

export default function EmptyMaintenanceRequestsList() {
  const { colors } = useColors();

  return (
    <View className="flex-1 items-center justify-center py-20">
      <View className="bg-surface rounded-full p-5 mb-4">
        <IconHammer size={32} color={colors.gray500} />
      </View>
      <Text className="text-foreground text-lg font-interSemiBold">
        No maintenance requests
      </Text>
      <Text className="text-gray-500 text-sm font-inter text-center mt-1">
        Requests from tenants will appear here.
      </Text>
    </View>
  );
}
