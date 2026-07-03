import { View, Text } from "react-native";

import { Calendar } from "lucide-react-native";

import { useColors } from "@/hooks/useTheme";

export default function EmptyPending() {
  const { colors } = useColors();

  return (
    <View className="flex-1 items-center justify-center py-20">
      <View className="bg-surface rounded-full p-5 mb-4">
        <Calendar size={30} color={colors.gray400} />
      </View>
      <Text className="text-foreground text-lg font-interSemiBold">
        No pending requests
      </Text>
      <Text className="text-gray-500 text-sm font-inter text-center mt-1">
        Pending visit requests will show up here.
      </Text>
    </View>
  );
}
