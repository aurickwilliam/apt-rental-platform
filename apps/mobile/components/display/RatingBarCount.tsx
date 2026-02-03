import { View, Text } from 'react-native'

import {
  IconStarFilled
} from '@tabler/icons-react-native';

import { COLORS } from '../../constants/colors';

interface RatingBarCountProps {
  rating: number;
  ratingCount: number;
  totalReviews: number;
}

export default function RatingBarCount({ 
  rating, 
  ratingCount, 
  totalReviews 
}: RatingBarCountProps) {

  // Calculate the percentage width for the filled bar
  const filledWidthPercentage = (ratingCount / totalReviews) * 100;

  return (
    <View className='flex-row items-center gap-3'>
      <View className='flex-row items-center justify-center w-10'>
        <Text className='text-text text-sm font-interMedium mr-2 flex-1 text-center'>
          {rating}
        </Text>

        <IconStarFilled 
          size={20} 
          color={COLORS.secondary}
        />
      </View>

      <View className='flex-1 bg-grey-100 rounded-full h-4 overflow-hidden'>
        <View 
          className='bg-secondary h-4 rounded-full' 
          style={{ width: `${filledWidthPercentage}%` }}
        />
      </View>

      {/* Rating Count */}
      <View className='w-10 items-end'>
        <Text className='text-text text-sm font-interMedium'>
          {ratingCount}
        </Text>
      </View>
    </View>
  )
}