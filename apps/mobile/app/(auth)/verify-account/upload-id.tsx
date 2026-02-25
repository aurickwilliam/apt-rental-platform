import { View, Text } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useState } from 'react'

import ScreenWrapper from '@/components/layout/ScreenWrapper'
import StandardHeader from '@/components/layout/StandardHeader'
import UploadImageField from '@/components/inputs/UploadImageField';
import CheckBox from '@/components/buttons/CheckBox';
import PillButton from '@/components/buttons/PillButton'

export default function UploadId() {
  const { selectedId } = useLocalSearchParams();
  const router = useRouter();

  const [isConfirmed, setIsConfirmed] = useState<boolean>(false);

  return (
    <ScreenWrapper
      className='p-5'
      header={
        <StandardHeader title='Upload Your ID' />
      }
      scrollable
    >
      <View className='flex gap-2'>
        <Text className='text-2xl text-secondary font-interMedium'>
          {selectedId}
        </Text>
        <Text className='text-base text-grey-500 font-inter'>
          Accepted formats: JPG, PNG, or PDF (max 5MB each)
        </Text>
      </View>

      {/* Upload Fields */}
      <View className='flex gap-5 mt-5'>
        {/* Front */}
        <UploadImageField 
          label='Front of ID:'
          required
        />

        {/* Back */}
        <UploadImageField 
          label='Back of ID:' 
          required
        />
      </View>

      <View className='mt-5'>
        <CheckBox 
          label={'I confirm that the information provided is true and the ID belongs to me.'} 
          selected={isConfirmed} 
          onPress={() => setIsConfirmed(!isConfirmed)}        
        />
      </View>

      <View className='mt-20'>
        <PillButton 
          label='Verify ID'
          onPress={() => router.push('/verify-account/success')}
        />
      </View>
    </ScreenWrapper>
  )
}