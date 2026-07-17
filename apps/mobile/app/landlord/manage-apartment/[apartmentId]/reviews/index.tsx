import { useLocalSearchParams } from 'expo-router'
import { FlatList, RefreshControl, Text, View } from 'react-native'
import ScreenWrapper from '@/components/layout/ScreenWrapper'
import StandardHeader from '@/components/layout/StandardHeader'
import RatingCard from '@/components/cards/RatingCard'
import RatingCardSkeleton from '../components/RatingCardSkeleton'
import MenuSelectButton from '@/components/buttons/MenuSelectButton'
import { useColors } from 'hooks/useTheme'

import { useApartmentReviews, type ReviewSortOption } from 'hooks/ratings'
import StarRating from '@/components/display/StarRating'

const SORT_OPTIONS: ReviewSortOption[] = [
  'Most Recent',
  'Highest Rating',
  'Lowest Rating',
]

export default function ReviewsPage() {
  const { apartmentId } = useLocalSearchParams<{ apartmentId: string }>()
  const { colors } = useColors()

  const {
    loading,
    refreshing,
    reviews,
    overallRating,
    totalReviews,
    sortBy,
    setSortBy,
    refetch,
  } = useApartmentReviews(apartmentId)

  if (loading) {
    return (
      <ScreenWrapper header={<StandardHeader title='Reviews' />}>
        <View style={{ padding: 20, gap: 12 }}>
          {Array.from({ length: 4 }).map((_, index) => (
            <RatingCardSkeleton key={index} />
          ))}
        </View>
      </ScreenWrapper>
    )
  }

  return (
    <ScreenWrapper header={<StandardHeader title='Reviews' />}>
      <FlatList
        data={reviews}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 20, gap: 12, paddingBottom: 32 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refetch}
            tintColor={colors.primary}
          />
        }
        ListHeaderComponent={
          totalReviews > 0 ? (
            <View className='flex-row items-center justify-between mb-2'>
              <View className='flex-row items-center gap-1.5'>
                <StarRating rating={overallRating} size={20} />
                <Text className='text-foreground text-base font-interMedium'>
                  {overallRating.toFixed(1)}
                </Text>
                <Text className='text-muted text-sm font-inter'>
                  · {totalReviews} {totalReviews === 1 ? 'Review' : 'Reviews'}
                </Text>
              </View>

              <MenuSelectButton
                label='Sort by'
                options={SORT_OPTIONS}
                value={sortBy}
                onSelect={setSortBy}
              />
            </View>
          ) : null
        }
        ListEmptyComponent={
          <View className='items-center justify-center py-16 gap-1'>
            <Text className='text-foreground text-base font-interMedium'>
              No reviews yet
            </Text>
            <Text className='text-muted text-sm font-inter text-center'>
              Reviews from tenants will show up here once they&apos;re submitted.
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <RatingCard
            name={item.name}
            date={item.date}
            rating={item.rating}
            review={item.review}
            profilePictureUrl={item.profilePictureUrl}
            durationOfStay={item.durationOfStay}
            images={item.images}
          />
        )}
      />
    </ScreenWrapper>
  )
}
