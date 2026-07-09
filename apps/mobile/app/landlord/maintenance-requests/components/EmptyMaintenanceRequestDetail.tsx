import { View, Text } from "react-native";

import { Hammer } from "lucide-react-native";

import { useColors } from "@/hooks/useTheme";

export default function EmptyMaintenanceRequestDetail() {
  const { colors } = useColors();

  return (
    <View className="flex-1 items-center justify-center py-20">
      <View className="bg-surface rounded-full p-5 mb-4">
        <Hammer size={32} color={colors.gray500} />
      </View>
      <Text className="text-foreground text-lg font-interSemiBold">
        Request not found
      </Text>
      <Text className="text-gray-500 text-sm font-inter text-center mt-1">
        This maintenance request may have been removed.
      </Text>
    </View>
  );
}
