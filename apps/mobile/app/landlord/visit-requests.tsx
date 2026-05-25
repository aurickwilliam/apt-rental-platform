import { View, Text } from "react-native";

import { IconHome } from "@tabler/icons-react-native";

import ScreenWrapper from "@/components/layout/ScreenWrapper";
import StandardHeader from "@/components/layout/StandardHeader";

import { COLORS } from "@repo/constants";

export default function VisitRequests() {
  return (
    <ScreenWrapper
      scrollable
      className="p-5"
      header={<StandardHeader title="Visit Requests" />}
      backgroundColor={COLORS.darkerWhite}
    >
      <View className="flex-1 items-center justify-center py-10">
        <View className="bg-white rounded-full p-5 mb-4">
          <IconHome size={32} color={COLORS.grey} />
        </View>
        <Text className="text-text text-lg font-interSemiBold">
          No visit requests
        </Text>
        <Text className="text-grey-500 text-sm font-inter text-center mt-1">
          Scheduled visit requests will show up here.
        </Text>
      </View>
    </ScreenWrapper>
  );
}
