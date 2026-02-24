import { Image, TouchableOpacity, ImageSourcePropType } from 'react-native'
import { useLocalSearchParams } from 'expo-router'
import ImageViewing from 'react-native-image-viewing';
import { useState } from 'react';

import ScreenWrapper from '@/components/layout/ScreenWrapper'
import StandardHeader from '@/components/layout/StandardHeader'

export default function Details() {
  const { docImage, docType } = useLocalSearchParams();

  const [isDocumentVisiable, setIsDocumentVisiable] = useState<boolean>(false);

  const imageSource: ImageSourcePropType = { uri: decodeURIComponent(docImage as string) };

  return (
    <ScreenWrapper
      header={
        <StandardHeader title={docType as string} />
      }
      className='p-5 flex items-center justify-center'
    >
      <TouchableOpacity
        className='w-full h-[70%] rounded-3xl border border-grey-300 p-3'
        activeOpacity={0.7}
        onPress={() => setIsDocumentVisiable(true)}
      >
        <Image
          source={imageSource}
          style={{
            width: '100%',
            height: '100%',
          }}
          resizeMode='contain'
        />
      </TouchableOpacity>

      {/* For Image Viewing */}
      <ImageViewing
        images={[imageSource]}
        imageIndex={0}
        visible={isDocumentVisiable}
        onRequestClose={() => setIsDocumentVisiable(false)}
        presentationStyle='overFullScreen'
        backgroundColor='rgb(0, 0, 0, 0.8)'
      />
    </ScreenWrapper>
  )
}