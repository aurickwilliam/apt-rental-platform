import { View, Text } from 'react-native'
import { Image, ImageSource } from 'expo-image';

import type { TranslationKey } from '@repo/i18n';

import { useTranslation } from '@/hooks/i18n';

interface OnBoardingSlideProps {
  slide: {
    id: number;
    titleKey: TranslationKey;
    descriptionKey: TranslationKey;
    imagePath: ImageSource;
  },
  width: number;
}

export default function OnBoardingSlide({ slide, width }: OnBoardingSlideProps) {
  const { t } = useTranslation();

  return (
    <View className="flex-1 items-center justify-center px-4" style={{ width }}>
      
      {/* Image Container */}
      <View className="w-full h-120 mb-4 flex justify-center items-center">
        <Image 
          source={slide.imagePath} 
          style={{ width: '100%', height: '100%' }}
          contentFit="contain"
        />
      </View>

      {/* Text Container */}
      <View className="w-full flex gap-2 px-2">

        {/* Title */}
        <Text className="text-4xl font-nunitoBold text-accent">
          {t(slide.titleKey)}
        </Text>
        
        {/* Description */}
        <Text className="text-foreground text-lg font-nunitoSemiBold">
          {t(slide.descriptionKey)}
        </Text>

      </View>  
    </View>
  )
}