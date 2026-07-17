import { View, Text } from 'react-native'
import { IconStarFilled } from '@tabler/icons-react-native'
import { Slider } from 'heroui-native'

import { useColors } from 'hooks/useTheme'

interface RatingBarCountProps {
  rating: number
  ratingCount: number
  totalReviews: number
}

export default function RatingBarCount({
  rating,
  ratingCount,
  totalReviews,
}: RatingBarCountProps) {
  const { colors } = useColors()
  const filledPercentage = totalReviews > 0 ? (ratingCount / totalReviews) * 100 : 0

  return (
    <View
      className='flex-row items-center gap-3'
      accessibilityLabel={`${rating} star: ${ratingCount} of ${totalReviews} reviews`}
    >
      <View className='flex-row items-center w-10'>
        <Text className='text-foreground text-sm font-interMedium mr-1 flex-1 text-center'>
          {rating}
        </Text>
        <IconStarFilled size={16} color={colors.secondary} />
      </View>

      <View
        pointerEvents='none'
        className='flex-1'
      >
        <Slider
          value={filledPercentage}
          minValue={0}
          maxValue={100}
        >
          <Slider.Track className='h-3 rounded-full bg-gray-100'>
            <Slider.Fill className='rounded-full bg-secondary' />
          </Slider.Track>
        </Slider>
      </View>

      <View className='w-10 items-end'>
        <Text className='text-foreground text-sm font-interMedium'>
          {ratingCount}
        </Text>
      </View>
    </View>
  )
}
