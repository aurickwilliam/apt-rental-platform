import { View, Text } from 'react-native'
import { useState } from 'react'
import { useLocalSearchParams, useRouter } from 'expo-router'

import ScreenWrapper from 'components/layout/ScreenWrapper'
import StandardHeader from 'components/layout/StandardHeader'
import RatingBarCount from './components/RatingBarCount'
import MenuSelectButton from 'components/buttons/MenuSelectButton'
import RatingCard from 'components/cards/RatingCard'
import StarRating from '@/components/display/StarRating'

import { Button } from 'heroui-native'

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
      className='p-5'
    >
      {/* Overall Rating */}
      <View className='flex items-center justify-center gap-3'>
        <Text className='text-muted text-lg font-interMedium'>
          Overall Rating
        </Text>

        <Text className='text-secondary text-8xl font-nunitoBold leading-tight'>
          {ratings.overallRating}
        </Text>

        {/* Stars */}
        <StarRating
          rating={ratings.overallRating}
          size={35}
          className='flex-row gap-2'
        />

        <Text className='text-muted text-base font-interMedium'>
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
        <Text className='text-foreground text-base font-interMedium'>
          Tenant Reviews
        </Text>

        <MenuSelectButton
          label="Sort Reviews By"
          options={['Most Recent', 'Highest Rating', 'Lowest Rating']}
          value={selectedFilter}
          onSelect={setSelectedFilter}
        />
      </View>

      {/* Render List of Tenant Reviews */}
      <View className='flex gap-2 mt-3'>
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
        <Button onPress={handleWriteReview}>
          <Button.Label>
            Write a Review
          </Button.Label>
        </Button>
      </View>
    </ScreenWrapper>
  )
}
