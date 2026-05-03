import { TouchableOpacity, Image, ImageSourcePropType } from 'react-native'

interface PaymentMethodButtonProps {
  imageSource: ImageSourcePropType;
  onPress?: () => void;
}

export default function PaymentMethodButton({ imageSource, onPress }: PaymentMethodButtonProps) {
  return (
    <TouchableOpacity 
      className='w-[31%] h-20 items-center justify-between p-3 bg-white rounded-lg border border-grey-300'
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Image 
        source={imageSource} 
        style={{ width: '100%', height: '100%'}}
        resizeMode='contain'
      />
    </TouchableOpacity>
  )
}