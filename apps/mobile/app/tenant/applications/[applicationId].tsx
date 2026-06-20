import { View, Text } from 'react-native'
import { useLocalSearchParams } from 'expo-router';

import ScreenWrapper from '@/components/layout/ScreenWrapper';

import { useApartmentDetails } from '@/hooks/useApartmentDetails';

export default function ApplicationApartment() {
  const { applicationId } = useLocalSearchParams();
  const { apartment, loading } = useApartmentDetails(applicationId as string);

  return (
    <ScreenWrapper>
      <View className="flex-1 items-center justify-center">
        <Text className="text-2xl text-foreground font-interSemiBold">
          Apartment Details
        </Text>
        <Text className="text-base text-muted-foreground mt-2">
          View details about the apartment you applied for.
        </Text>
      </View>
    </ScreenWrapper>
  );
}