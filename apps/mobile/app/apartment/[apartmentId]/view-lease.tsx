import { View, Text, Image } from 'react-native'

import ScreenWrapper from 'components/layout/ScreenWrapper'
import StandardHeader from 'components/layout/StandardHeader'

import { SAMPLE_IMAGES } from 'constants/images'

export default function ViewLease() {
  return (
    <ScreenWrapper
      header={
        <StandardHeader title="Lease Agreement" />
      }
    >
      <View className='flex-1 items-center justify-center'>
        <Image 
          source={SAMPLE_IMAGES.sampleLeaseAgreement}
          style={{ width: '100%', height: '100%' }}
          resizeMode='contain'
        />
      </View>
    </ScreenWrapper>
  )
}