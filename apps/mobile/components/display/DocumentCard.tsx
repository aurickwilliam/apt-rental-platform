import { Text, TouchableOpacity, Image, View, ImageSourcePropType } from 'react-native'

interface DocumentCardProps {
  image: ImageSourcePropType;
  label: string;
  onPress: () => void;
}

export default function DocumentCard({ image, label, onPress }: DocumentCardProps) {
  return (
    <TouchableOpacity
      className='flex w-[49%] gap-1 items-center justify-center'
      activeOpacity={0.7}
      onPress={onPress}
    >
      <View className='w-full h-72 border-2 border-grey-200 rounded-2xl overflow-hidden'>
        <Image 
          source={image} 
          style={{
            width: '100%',
            height: '100%',
          }}
        />
      </View>
      
      <Text className='text-base text-text font-inter'>
        {label}
      </Text>
    </TouchableOpacity>
  )
}