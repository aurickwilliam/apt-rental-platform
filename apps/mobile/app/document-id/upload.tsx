import ScreenWrapper from '@/components/layout/ScreenWrapper'
import StandardHeader from '@/components/layout/StandardHeader'
import { View, Text } from 'react-native'

export default function Upload() {
  return (
    <ScreenWrapper
      scrollable
      header={
        <StandardHeader title='Upload Document' />
      }
      className='p-5'
    >
      <Text>Upload</Text>
    </ScreenWrapper>
  )
}