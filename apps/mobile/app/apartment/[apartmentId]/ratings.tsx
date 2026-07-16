import { View, Text, ActivityIndicator } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import ScreenWrapper from 'components/layout/ScreenWrapper'
import StandardHeader from 'components/layout/StandardHeader'
import RatingBarCount from './components/RatingBarCount'
import MenuSelectButton from 'components/buttons/MenuSelectButton'
import RatingCard from 'components/cards/RatingCard'
import StarRating from '@/components/display/StarRating'

import { useApartmentReviews } from 'hooks/ratings'
import { useColors } from 'hooks/useTheme'

import { Button } from 'heroui-native'

export default function RatingsPage() {
  const { apartmentId } = useLocalSearchParams<{ apartmentId: string }>();
  const { colors } = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const {
    loading,
    error,
    overallRating,
    totalReviews,
    ratingsCount,
    reviews,
    sortBy,
    setSortBy,
    canReview,
    checkingEligibility,
    reviewableTenancyId
  } = useApartmentReviews(apartmentId);

  const handleWriteReview = () => {
    router.push({
      pathname: `/apartment/[apartmentId]/rate-apartment`,
      params: {
        apartmentId: apartmentId,
        tenancyId: reviewableTenancyId
      },
    })
  }

  const showReviewButton = !checkingEligibility && canReview;

  if (loading) {
    return (
      <ScreenWrapper header={<StandardHeader title="Ratings & Reviews" />} className='p-5'>
        <View className='flex-1 items-center justify-center py-20'>
          <ActivityIndicator size='large' color={colors.primary} />
        </View>
      </ScreenWrapper>
    )
  }

  return (
    <View className='flex-1'>
      <ScreenWrapper
        scrollable
        header={
          <StandardHeader title="Ratings & Reviews" />
        }
        className='p-5'
      >
        {error && (
          <Text className='text-red-500 text-sm font-inter text-center mb-3'>
            {error}
          </Text>
        )}

        {/* Overall Rating */}
        <View className='flex items-center justify-center gap-3'>
          <Text className='text-muted text-lg font-interMedium'>
            Overall Rating
          </Text>

          <Text className='text-secondary text-8xl font-nunitoBold leading-tight'>
            {overallRating.toFixed(1)}
          </Text>

          <StarRating
            rating={overallRating}
            size={35}
            className='flex-row gap-2'
          />

          <Text className='text-muted text-base font-interMedium'>
            based on {totalReviews} {totalReviews === 1 ? 'Review' : 'Reviews'}
          </Text>
        </View>

        {/* Ratings count */}
        <View className='flex gap-2 mt-5'>
          {
            ratingsCount.map(({ rating, ratingCount, totalCount }) => (
              <RatingBarCount
                key={rating}
                rating={rating}
                ratingCount={ratingCount}
                totalReviews={totalCount}
              />
            ))
          }
        </View>

        {/* Title */}
        <View className='mt-10 flex-row items-center justify-between'>
          <Text className='text-foreground text-base font-interMedium'>
            Tenant Reviews
          </Text>

          <MenuSelectButton
            label="Sort Reviews By"
            options={['Most Recent', 'Highest Rating', 'Lowest Rating']}
            value={sortBy}
            onSelect={setSortBy}
          />
        </View>

        {/* Render List of Tenant Reviews */}
        {totalReviews === 0 ? (
          <View className='items-center justify-center py-10'>
            <Text className='text-muted text-sm font-inter'>
              No reviews yet. Be the first to share your experience!
            </Text>
          </View>
        ) : (
          <View className='flex gap-2 mt-3'>
            {
              reviews.map(({ id, name, date, rating, review, profilePictureUrl, durationOfStay }) => (
                <RatingCard
                  key={id}
                  name={name}
                  date={date}
                  rating={rating}
                  review={review}
                  profilePictureUrl={profilePictureUrl}
                  durationOfStay={durationOfStay}
                />
              ))
            }
          </View>
        )}

        {/* Spacer so the last review card isn't hidden behind the floating button */}
        {showReviewButton && <View style={{ height: 96 }} />}
      </ScreenWrapper>

      {/* Floating Review Button */}
      {showReviewButton && (
        <View
          className='absolute bottom-0 pt-3 left-0 right-0 px-5 bg-background border-t border-border'
          style={{
            paddingBottom: insets.bottom + 12
          }}
        >
          <Button onPress={handleWriteReview}>
            <Button.Label>
              Write a Review
            </Button.Label>
          </Button>
        </View>
      )}
    </View>
  )
}
