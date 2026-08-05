import { View, Text, TouchableOpacity, ImageSourcePropType } from 'react-native'
import { useLocalSearchParams } from 'expo-router'
import { Image } from 'expo-image'
import ImageViewing from 'react-native-image-viewing'
import { useState } from 'react'

import { IconZoomIn } from '@tabler/icons-react-native'

import ScreenWrapper from '@/components/layout/ScreenWrapper'
import StandardHeader from '@/components/layout/StandardHeader'

import { useColors } from '@/hooks/useTheme'

export default function Details() {
  const { docImage, docType } = useLocalSearchParams();
  const { colors } = useColors();

  const [isDocumentVisiable, setIsDocumentVisiable] = useState<boolean>(false);

  const imageSource: ImageSourcePropType = { uri: decodeURIComponent(docImage as string) };

  return (
    <ScreenWrapper
      header={
        <StandardHeader title={docType as string} />
      }
      className='p-5'
    >
      <View className='flex-1 gap-4'>
        <TouchableOpacity
          className='flex-1 bg-surface border border-border rounded-3xl shadow-none overflow-hidden'
          activeOpacity={0.7}
          onPress={() => setIsDocumentVisiable(true)}
        >
          <Image
            source={imageSource}
            style={{ width: '100%', height: '100%' }}
            contentFit='contain'
            cachePolicy='disk'
            transition={150}
          />
        </TouchableOpacity>

        <View className='flex-row items-center justify-center gap-1.5'>
          <IconZoomIn size={18} color={colors.gray400} />
          <Text className='text-muted text-sm font-interMedium'>
            Tap to view full screen
          </Text>
        </View>
      </View>

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