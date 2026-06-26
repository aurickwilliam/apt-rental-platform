import { View, Text } from "react-native";

import ScreenWrapper from "@/components/layout/ScreenWrapper";
import StandardHeader from "@/components/layout/StandardHeader";

import { FileXCorner } from "lucide-react-native";

import { useColors } from "@/hooks/useTheme";

export default function EmptyRequestData() {
  const { colors } = useColors();
  return (
    <ScreenWrapper
      header={<StandardHeader title="Visit Request" />}
    >
      <View className="flex-1 items-center justify-center px-6">
        <View className="rounded-full p-5 bg-surface mb-safe-or-5">
          <FileXCorner size={48} color={colors.gray400}  />
        </View>

        <Text className="text-foreground text-base font-interSemiBold">
          Visit request not found
        </Text>
        <Text className="text-gray-500 text-sm font-inter text-center mt-2">
          Please return to the visit request list.
        </Text>
      </View>
    </ScreenWrapper>
  )
}
