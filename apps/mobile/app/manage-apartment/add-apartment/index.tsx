import { View, Text } from 'react-native'
import { useRouter } from 'expo-router'

import ScreenWrapper from '@/components/layout/ScreenWrapper'

import { COLORS } from '@repo/constants'
import ApplicationHeader from '@/components/display/ApplicationHeader'
import UploadImageField from '@/components/inputs/UploadImageField'
import TextField from '@/components/inputs/TextField'
import PillButton from '@/components/buttons/PillButton'

export default function Index() {
  const router = useRouter();

  return (
    <ScreenWrapper
      scrollable
      backgroundColor={COLORS.darkerWhite}
    >
      <ApplicationHeader 
        currentTitle={'Photos & Title'} 
        nextTitle={'Basic Info'} 
        step={1}   
        totalSteps={5}     
      />

      <View className='p-5 flex'>
        <View className='flex gap-5'>
          <TextField 
            label='Apartment Name:'
            required
            placeholder='Enter apartment name'
          />

          <UploadImageField 
            label='Add a Thumbnail:'
            required
          />

          <UploadImageField 
            label='Add Additional Photos:'
            required
          />
        </View>

        {/* Cancel or Next Button */}
        <View className='flex-1 flex-row mt-16 gap-4'>
          <View className='flex-1'>
            <PillButton
              label={'Cancel'}
              type='danger'
              isFullWidth
              onPress={() => router.back()}
            />
          </View>
          <View className='flex-1'>
            <PillButton
              label={'Next'}
              isFullWidth
              onPress={() => {}}
            />
          </View>
        </View>
      </View>
    </ScreenWrapper>
  )
}