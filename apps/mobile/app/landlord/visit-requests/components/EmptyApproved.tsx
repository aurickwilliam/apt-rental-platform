import { View, Text } from "react-native";

import { House } from "lucide-react-native";

import { useColors } from "@/hooks/useTheme";

export default function EmptyApproved() {
  const { colors } = useColors();

  return (
    <View className="flex-1 items-center justify-center py-12">
      <View className="bg-white rounded-full p-5 mb-4">
        <House size={28} color={colors.gray500} />
      </View>
      <Text className="text-foreground text-lg font-interSemiBold">
        No approved visits
      </Text>
      <Text className="text-muted text-sm font-inter text-center mt-1">
        Approved visit requests will appear here.
      </Text>
    </View>
  );
}
