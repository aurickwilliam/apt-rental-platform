import { View, Text } from 'react-native'
import { useRouter } from 'expo-router'

import ScreenWrapper from '@/components/layout/ScreenWrapper'
import StandardHeader from '@/components/layout/StandardHeader'
import OptionButton from '@/components/buttons/OptionButton'

import { VALID_IDS, SECONDARY_IDS } from '@repo/constants'

export default function SelectId() {
  const router = useRouter();

  // Handle navigation when an ID is selected
  const handleIdSelection = (id: string) => {
    router.push(`/(auth)/verify-account/upload-id?selectedId=${id}`);
  }

  return (
    <ScreenWrapper
      className='p-5'
      header={
        <StandardHeader title='Select a Valid ID' />
      }
      scrollable
    >
      <View className='flex gap-3'>
        <Text className='text-text text-base font-interMedium'>
          List of Valid IDs:
        </Text>
        {
          VALID_IDS.map((id) => (
            <OptionButton 
              key={id}
              title={id} 
              onPress={() => handleIdSelection(id)}
            />
          ))
        }

        <Text className='text-text text-base font-interMedium'>
          List of Secondary IDs:
        </Text>
        {
          SECONDARY_IDS.map((id) => (
            <OptionButton 
              key={id}
              title={id} 
              onPress={() => handleIdSelection(id)}
            />
          ))
        }
      </View>
    </ScreenWrapper>
  )
}