import { View, Text, Image, ImageSourcePropType } from 'react-native'

interface OnBoardingSlideProps {
  slide: {
    id: number;
    title: string;
    description: string;
    imagePath: ImageSourcePropType;
  },
  width: number;
}

export default function OnBoardingSlide({ slide, width }: OnBoardingSlideProps) {
  return (
    <View className="flex-1 items-center justify-center px-4" style={{ width }}>
      
      {/* Image Container */}
      <View className="w-full h-120 mb-4 flex justify-center items-center">
        <Image 
          source={slide.imagePath} 
          style={{ width: '100%', height: '100%', resizeMode: 'contain' }}
        />
      </View>

      {/* Text Container */}
      <View className="w-full flex gap-2 px-2">

        {/* Title */}
        <Text className="text-4xl font-nunitoSemiBold text-secondary">
          {slide.title}
        </Text>
        
        {/* Description */}
        <Text className="text-text text-lg font-interMedium">
          {slide.description}
        </Text>

      </View>  
    </View>
  )
}