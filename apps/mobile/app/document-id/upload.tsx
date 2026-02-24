import { View, Text } from 'react-native'

import ScreenWrapper from '@/components/layout/ScreenWrapper'
import StandardHeader from '@/components/layout/StandardHeader'


export default function Upload() {
  return (
    <ScreenWrapper
      scrollable
      header={
        <StandardHeader title='Upload Document' />
      }
      className='p-5'
    >
      <Text className='text-text text-base font-interMedium mb-5'>
        Please select the type of document you want to upload. Make sure to take clear photos of your documents for successful verification.
      </Text>
    </ScreenWrapper>
  )
}