import { Image, TouchableOpacity, ImageSourcePropType } from 'react-native'
import { useLocalSearchParams } from 'expo-router'

import ScreenWrapper from '@/components/layout/ScreenWrapper'
import StandardHeader from '@/components/layout/StandardHeader'

export default function Details() {
  const { docId, docImage, docType } = useLocalSearchParams();

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
      >
        <Image
          source={docImage as ImageSourcePropType}
          style={{
            width: '100%',
            height: '100%',
          }}
          resizeMode='contain'
        />
      </TouchableOpacity>
    </ScreenWrapper>
  )
}