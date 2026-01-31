import { View, Text } from 'react-native'
import { useLocalSearchParams } from 'expo-router'

import ScreenWrapper from 'components/layout/ScreenWrapper'
import StandardHeader from 'components/layout/StandardHeader'

import { COLORS } from '../../../constants/colors'

import {
  IconStarFilled,
  IconStar,
} from '@tabler/icons-react-native';
import RatingBarCount from 'components/display/RatingBarCount'

export default function RatingsPage() {
  const { apartmentId } = useLocalSearchParams<{ apartmentId: string }>();

  // Dummy data for demonstration purposes
  const ratings = {
    overallRating: 4.5,
    totalReviews: 120,
    ratingsCount: [
      { rating: 5, ratingCount: 80, totalCount: 120 },
      { rating: 4, ratingCount: 25, totalCount: 120 },
      { rating: 3, ratingCount: 10, totalCount: 120 },
      { rating: 2, ratingCount: 3, totalCount: 120 },
      { rating: 1, ratingCount: 2, totalCount: 120 },
    ]
  };

  return (
    <ScreenWrapper
      scrollable
      header={
        <StandardHeader title="Ratings & Reviews" />
      }
      headerBackgroundColor={COLORS.primary}
      className='p-5'
    >
      {/* Overall Rating */}
      <View className='flex items-center justify-center'>
        <Text className='text-grey-500 text-lg font-poppinsMedium'>
          Overall Rating
        </Text>

        <Text className='text-secondary text-8xl font-dmserif mt-5 leading-tight'>
          {ratings.overallRating}
        </Text>

        {/* Stars */}
        <View className='flex-row gap-2'>
          {[1, 2, 3, 4, 5].map((star) => (
            star <= Math.round(ratings.overallRating) ? (
              <IconStarFilled 
                key={star} 
                size={35} 
                color={COLORS.secondary} 
              />
            ) : (
              <IconStar 
                key={star} 
                size={35} 
                color={COLORS.secondary} 
              />
            )
          ))}
        </View>

        <Text className='text-grey-500 text-lg font-poppins mt-3'>
          based on {ratings.totalReviews} Reviews
        </Text>
      </View>

      {/* Ratings count */}
      <View className='flex gap-2 mt-5'>
        {
          ratings.ratingsCount.map(({ rating, ratingCount, totalCount }) => (
            <RatingBarCount 
              key={rating}
              rating={rating}
              ratingCount={ratingCount}
              totalReviews={totalCount}
            />
          ))
        }
      </View>

      {/* List of Tenants Reviews */}
      <View>
        
      </View>
    </ScreenWrapper>
  )
}