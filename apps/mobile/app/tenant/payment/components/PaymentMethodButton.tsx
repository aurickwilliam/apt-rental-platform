import { ReactNode } from 'react'
import {
  TouchableOpacity,
  View,
  Text,
  Image,
  ImageSourcePropType
} from 'react-native'

import {
  IconCircleCheckFilled
} from '@tabler/icons-react-native'

import { useColors } from 'hooks/useTheme'

type PaymentMethodButtonVariant = 'tile' | 'chip';

interface PaymentMethodButtonProps {
  imageSource?: ImageSourcePropType;
  icon?: ReactNode;
  label?: string;
  selected?: boolean;
  onPress?: () => void;
  variant?: PaymentMethodButtonVariant;
}

export default function PaymentMethodButton({
  imageSource,
  icon,
  label,
  selected = false,
  onPress,
  variant = 'tile',
}: PaymentMethodButtonProps) {
  const { colors } = useColors();

  const isTile = variant === 'tile';

  const containerBase = isTile
    ? 'w-[48.5%] min-h-[76px] p-2 items-center justify-center bg-white rounded-xl border'
    : 'flex-row items-center gap-2 px-3 py-2 bg-white rounded-xl border';

  const borderClass = selected
    ? 'border-primary border-2'
    : 'border-border';

  const backgroundClass = selected ? 'bg-primary/5' : 'bg-white';

  return (
    <TouchableOpacity
      className={`${containerBase} ${borderClass} ${backgroundClass} relative`}
      onPress={onPress}
      activeOpacity={0.7}
      accessibilityRole='radio'
      accessibilityState={{ selected }}
    >
      {selected && (
        <View className='absolute top-1 right-1 w-5 h-5 rounded-full items-center justify-center'>
          <IconCircleCheckFilled
            size={22}
            color={colors.primary}
          />
        </View>
      )}

      {isTile ? (
        <>
          <View className='w-10 h-6 items-center justify-center'>
            {icon ? icon : imageSource ? (
              <Image
                source={imageSource}
                style={{ width: '100%', height: '100%' }}
                resizeMode='contain'
              />
            ) : null}
          </View>

          {label ? (
            <Text
              numberOfLines={1}
              className='text-foreground text-xs font-interMedium mt-2 text-center'
            >
              {label}
            </Text>
          ) : null}
        </>
      ) : (
        <>
          <View className='w-10 h-6 items-center justify-center'>
            {icon ? icon : imageSource ? (
              <Image
                source={imageSource}
                style={{ width: '100%', height: '100%' }}
                resizeMode='contain'
              />
            ) : null}
          </View>

          {label ? (
            <Text
              numberOfLines={1}
              className='text-foreground text-sm font-interMedium'
            >
              {label}
            </Text>
          ) : null}
        </>
      )}
    </TouchableOpacity>
  )
}
