import { Text, TouchableOpacity, Image, View } from 'react-native'

interface DocumentCardProps {
  image: string;
  label: string;
  onPress: () => void;
}

export default function DocumentCard({ image, label, onPress }: DocumentCardProps) {
  return (
    <TouchableOpacity
      className='flex w-[48%] gap-1 items-center justify-center'
      activeOpacity={0.7}
      onPress={onPress}
    >
      <View className='w-full h-72 border-2 border-grey-200 rounded-2xl overflow-hidden'>
        <Image 
          source={{ uri: image }} 
          style={{
            width: '100%',
            height: '100%',
          }}
          resizeMode='cover'
        />
      </View>
      
      <Text className='text-base text-text font-inter'>
        {label}
      </Text>
    </TouchableOpacity>
  )
}