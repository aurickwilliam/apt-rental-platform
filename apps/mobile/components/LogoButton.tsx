import { Pressable, Image, View, ImageSourcePropType } from 'react-native'

interface LogoButtonProps {
  image: ImageSourcePropType 
}

export default function LogoButton({image}: LogoButtonProps) {
  return (
    <Pressable className='p-4 bg-white border border-grey-200 rounded-full self-center'>
      <View className='h-9 w-9'>
        <Image 
          source={image}
          style={{ width: '100%', height: '100%' }}
        />
      </View>
    </Pressable>
  )
}