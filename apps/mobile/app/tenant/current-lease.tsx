import { Image, TouchableOpacity } from 'react-native'
import ImageViewing from 'react-native-image-viewing';
import { useState } from 'react';

import ScreenWrapper from 'components/layout/ScreenWrapper';
import StandardHeader from 'components/layout/StandardHeader';

import { SAMPLE_IMAGES } from 'constants/images';

export default function CurrentLease() {
  const [isVisible, setIsVisible] = useState<boolean>(false);

  const leaseAgreement = SAMPLE_IMAGES.sampleLeaseAgreement || { uri: ''};

  return (
    <ScreenWrapper
      header={
        <StandardHeader title="Current Lease"/>
      }
      className='p-5 items-center justify-center'
    >
      <TouchableOpacity 
        activeOpacity={0.7}
        className='w-full h-[80%] rounded-2xl items-center justify-center border border-grey-300'
        onPress={() => setIsVisible(true)}
      >
        <Image 
          source={leaseAgreement}
          style={{ width: '100%', height: '100%'}}
          resizeMode='contain'
        />
      </TouchableOpacity>

      <ImageViewing
        images={[leaseAgreement]}
        imageIndex={0}
        visible={isVisible}
        onRequestClose={() => setIsVisible(false)}
      />
    </ScreenWrapper>
  )
}