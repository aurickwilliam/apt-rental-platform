import { View, Text } from 'react-native'
import { useState } from 'react'
import { useLocalSearchParams, useRouter } from 'expo-router'

import ScreenWrapper from 'components/layout/ScreenWrapper'
import StandardHeader from 'components/layout/StandardHeader'
import RatingBarCount from 'components/display/RatingBarCount'
import DropdownButton from 'components/buttons/DropdownButton'
import Divider from 'components/display/Divider'
import RatingCard from 'components/display/RatingCard'
import PillButton from 'components/buttons/PillButton'

import { COLORS } from '../../../constants/colors'

import {
  IconStarFilled,
  IconStar,
  IconCirclePlus,
} from '@tabler/icons-react-native';

export default function RatingsPage() {
  const { apartmentId } = useLocalSearchParams<{ apartmentId: string }>();
  const router = useRouter();

  const [selectedFilter, setSelectedFilter] = useState<'Most Recent' | 'Highest Rating' | 'Lowest Rating'>('Most Recent');

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
    ],
    reviews: [
      {
        id: 1,
        name: 'John Doe',
        date: '2023-08-15',
        rating: 5.0,
        review: 'Great place to stay!',
        durationOfStay: 'Jan 2023 - Mar 2023',
      },
      {
        id: 2,
        name: 'Jane Smith',
        date: '2023-07-10',
        rating: 4.5,
        review: 'Very comfortable and well-located.',
        durationOfStay: 'Feb 2023 - Apr 2023',
      },
      {
        id: 3,
        name: 'Alice Johnson',
        date: '2023-06-05',
        rating: 3.3,
        review: 'Average experience, could be better.',
        durationOfStay: 'Mar 2023 - May 2023',
      }
    ]
  };

  // Navigate to write a Review Page
  const handleWriteReview = () => {
    router.push(`/apartment/${apartmentId}/rate-apartment`);
  }

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

        <Text className='text-secondary text-9xl font-dmserif mt-5 leading-tight'>
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
      
      {/* Title */}
      <View className='mt-10 flex-row items-center justify-between'>
        <Text className='text-text text-base font-poppinsMedium'>
          Tenant Reviews
        </Text>

        <DropdownButton 
          bottomSheetLabel={'Sort Reviews By'} 
          options={['Most Recent', 'Highest Rating', 'Lowest Rating']}
          value={selectedFilter}
          onSelect={(value) => setSelectedFilter(value)}        
        />
      </View>

      <Divider />

      {/* Render List of Tenant Reviews */}
      <View className='flex gap-5'>
        {
          ratings.reviews.map(({ id, name, date, rating, review, durationOfStay }) => (
            <RatingCard 
              key={id}
              name={name}
              date={date}
              rating={rating}
              review={review}
              durationOfStay={durationOfStay}
            />
          ))
        }
      </View>

      {/* Review Button */}
      <View className='mt-10'>
        <PillButton 
          label='Write a Review'          
          onPress={handleWriteReview}
          leftIconName={IconCirclePlus}
        />
      </View>
    </ScreenWrapper>
  )
}