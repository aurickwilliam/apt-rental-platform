import { View, Text } from 'react-native'

import ScreenWrapper from '@/components/layout/ScreenWrapper'
import StandardHeader from '@/components/layout/StandardHeader'
import SearchField from '@/components/inputs/SearchField'
import Divider from '@/components/display/Divider'

import { COLORS } from '@repo/constants'
import PerkButton from '@/components/buttons/PerkButton'

export default function EditPerks() {

  const includedPerks = [
    'wifi',
    'ac',
    'tv',
    'kitchen',
    'parking',
    'hotwater',
    'bath'
  ]
  
  return (
    <ScreenWrapper
      className='p-5'
      scrollable
      header={
        <StandardHeader title='Edit Perks' />
      }
    >
      <SearchField 
        searchPlaceholder='Search a perk'
        onChangeSearch={() => {}} 
        searchValue={''}    
        backgroundColor={COLORS.darkerWhite}    
      />

      <Divider />

      <View className='flex gap-3'>
        <Text className='text-text text-lg font-interMedium'>
          Added Perks
        </Text>

        <View className='flex-row flex-wrap gap-5'>
          {
            includedPerks.map(perkId => (
              <PerkButton 
                key={perkId}
                perkId={perkId}
                isSelected
              />
            ))
          }
        </View>
      </View>

      <View className='flex gap-3 mt-5'>
        <Text className='text-text text-lg font-interMedium'>
          Added Perks
        </Text>

        <View className='flex-row flex-wrap gap-5'>
          {
            includedPerks.map(perkId => (
              <PerkButton 
                key={perkId}
                perkId={perkId}
                onPress={() => {
                  console.log("ADDED!", perkId)
                }}
              />
            ))
          }
        </View>
      </View>
    </ScreenWrapper>
  )
}