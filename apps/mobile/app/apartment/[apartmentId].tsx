import { View, Text } from 'react-native'
import { useLocalSearchParams } from 'expo-router'

import ScreenWrapper from 'components/layout/ScreenWrapper'

export default function ApartmentScreen() {
  const { apartmentId } = useLocalSearchParams<{ apartmentId: string }>()

  return (
    <ScreenWrapper
      scrollable
    >
      <View>
        <Text>Apartment Details {apartmentId}</Text>
      </View>
    </ScreenWrapper>
  )
}
