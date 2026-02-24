import { View, Text } from 'react-native'

import ScreenWrapper from '@/components/layout/ScreenWrapper'
import StandardHeader from '@/components/layout/StandardHeader'

export default function SelectDocument() {
  return (
    <ScreenWrapper
      scrollable
      header={
        <StandardHeader title='Select Document Type' />
      }
      className='p-5'
    >
      <Text>SelectDocument</Text>
    </ScreenWrapper>
  )
}