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
      <View className="w-full h-[30rem] mb-4 flex justify-center items-center">
        <Image 
          source={slide.imagePath} 
          style={{ width: '100%', height: '100%', resizeMode: 'contain' }}
        />
      </View>

      {/* Text Container */}
      <View className="w-full flex gap-3 px-2">

        {/* Title */}
        <Text className="text-5xl font-dmserif text-secondary">
          {slide.title}
        </Text>
        
        {/* Description */}
        <Text className="text-text text-xl font-poppins">
          {slide.description}
        </Text>

      </View>  

    </View>
  )
}