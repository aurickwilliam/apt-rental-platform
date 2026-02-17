import { View } from 'react-native'
import { useLocalSearchParams } from 'expo-router'

import ScreenWrapper from '../../../components/layout/ScreenWrapper'
import StandardHeader from '../../../components/layout/StandardHeader'
import PerkItem from '../../../components/display/PerkItem'

export default function IncludedPerks() {
  const { apartmentId } = useLocalSearchParams();

  // Dummy Data for Included Perks
  const includedPerks = [
    'wifi',
    'ac',
    'tv',
    'kitchen',
    'parking',
    'hotwater',
    'bath'
  ]

  // TODO: Fetch the actual included perks for the apartment using the apartmentId from the params
  // TODO: Sort the perks based on categories (e.g. Essentials, Appliances, etc.)

  return (
    <ScreenWrapper
      scrollable
      header={
        <StandardHeader title='Included Perks' />
      }
      className='p-5'
      bottomPadding={50}
    >
      <View className='flex items-start gap-3'>
        {includedPerks.map(perkId => (
          <PerkItem key={perkId} perkId={perkId} />
        ))}
      </View>
    </ScreenWrapper>
  )
}