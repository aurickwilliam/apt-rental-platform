import { View, Text } from 'react-native'
import { useRouter } from 'expo-router'
import { Image } from 'expo-image';

import ScreenWrapper from 'components/layout/ScreenWrapper'

import { IMAGES } from 'constants/images'

import { Button } from 'heroui-native'

import { useApplicationFormStore } from '@/stores/useApplicationFormStore'

export default function Submitted() {
  const router = useRouter();
  const { apartmentContext } = useApplicationFormStore();

  const apartmentName = apartmentContext.name || 'No Apartment Name'

  return (
    <ScreenWrapper className="p-5">
      <View className="flex-1 items-center justify-center">
        {/* Image */}
        <View className="size-40 mb-5">
          <Image
            source={IMAGES.houseCheck}
            style={{
              width: "100%",
              height: "100%",
            }}
          />
        </View>

        <Text className="text-accent font-interSemiBold text-3xl mb-5">
          Application Sent!
        </Text>

        <Text className="text-foreground font-interMedium text-base mt-2 text-center mx-10">
          Your application for {apartmentName} has been submitted. Rental Owner
          will review your application and get back to you soon.
        </Text>
      </View>

      <View className="flex gap-5">
        <Button onPress={() => router.navigate(`/(tabs)/(tenant)/rentals`)}>
          <Button.Label>View Application Status</Button.Label>
        </Button>
      </View>
    </ScreenWrapper>
  );
}