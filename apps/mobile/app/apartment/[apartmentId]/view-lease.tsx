import { Image, TouchableOpacity } from 'react-native'
import { useState } from 'react';
import { useLocalSearchParams } from 'expo-router';
import ImageViewing from 'react-native-image-viewing';


import ScreenWrapper from 'components/layout/ScreenWrapper'
import StandardHeader from 'components/layout/StandardHeader'

import { SAMPLE_IMAGES } from 'constants/images'

export default function ViewLease() {
  const { apartmentId } = useLocalSearchParams<{ apartmentId: string }>();

  const [isVisible, setIsVisible] = useState<boolean>(false);
  
  const leaseAgreementImage = SAMPLE_IMAGES.sampleLeaseAgreement || {uri: ''};

  return (
    <ScreenWrapper
      header={
        <StandardHeader title="Lease Agreement" />
      }
      className='p-5 items-center justify-center'
    >
      <TouchableOpacity 
        activeOpacity={0.7}
        className='w-full h-[80%] border border-grey-300 rounded-2xl'
        onPress={() => setIsVisible(true)}
      >
        <Image 
          source={leaseAgreementImage}
          style={{ width: '100%', height: '100%' }}
          resizeMode='contain'
        />
      </TouchableOpacity>

      <ImageViewing
        images={[leaseAgreementImage]} 
        imageIndex={0} 
        visible={isVisible} 
        onRequestClose={() => setIsVisible(false)}      
      />
    </ScreenWrapper>
  )
}