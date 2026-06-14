import { View, Text, Image } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";

import ScreenWrapper from "components/layout/ScreenWrapper";

import { IMAGES } from "constants/images";

import { Button } from "heroui-native";

export default function Success() {
  const router = useRouter();
  const { apartmentId } = useLocalSearchParams<{ apartmentId: string }>();

  return (
    <ScreenWrapper className="p-5 flex items-center justify-center">
      <Image source={IMAGES.houseCheck} style={{ width: 200, height: 200 }} />

      <View>
        <Text className="text-lg font-interSemiBold text-center mt-5 text-accent">
          You’ve successfully posted your property!
        </Text>

        <Text className="text-sm font-interMedium text-center mt-2 text-foreground">
          Great job! Tenants can now view and apply for your listing. Keep it
          updated to attract more renters.
        </Text>
      </View>

      <View className="w-full mt-10 flex gap-3">
        <Button
          onPress={() => router.replace(`/manage-apartment/${apartmentId}`)}
        >
          <Button.Label>View My Property</Button.Label>
        </Button>

        <Button
          variant="tertiary"
          onPress={() => router.replace("/(tabs)/(landlord)/dashboard")}
        >
          <Button.Label>Go to Dashboard</Button.Label>
        </Button>
      </View>
    </ScreenWrapper>
  );
}
