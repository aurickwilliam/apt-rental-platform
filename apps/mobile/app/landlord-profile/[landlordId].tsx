import { View, Text } from 'react-native'

import ScreenWrapper from 'components/layout/ScreenWrapper'
import StandardHeader from 'components/layout/StandardHeader'

import { COLORS } from '../../constants/colors'

export default function LandlordProfile() {
  return (
    <ScreenWrapper
      scrollable
      header={
        <StandardHeader title="Landlord Profile" />
      }
      headerBackgroundColor={COLORS.primary}
    >
      <Text>Landlord Profile Screen</Text>
    </ScreenWrapper>
  )
}