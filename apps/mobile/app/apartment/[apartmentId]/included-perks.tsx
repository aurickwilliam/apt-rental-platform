import { View, Text } from 'react-native'

import ScreenWrapper from 'components/layout/ScreenWrapper'
import StandardHeader from 'components/layout/StandardHeader'

import { COLORS } from '../../../constants/colors'

export default function IncludedPerks() {
  return (
    <ScreenWrapper
      scrollable
      header={
        <StandardHeader title='Included Perks' />
      }
      headerBackgroundColor={COLORS.primary}
    >
      <Text>IncludedPerks</Text>
    </ScreenWrapper>
  )
}