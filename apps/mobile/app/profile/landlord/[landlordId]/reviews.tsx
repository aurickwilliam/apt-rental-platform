import { useState } from 'react'
import { useLocalSearchParams } from 'expo-router'
import { FlatList, Text, View } from 'react-native'
import { Spinner } from 'heroui-native'

import ScreenWrapper from 'components/layout/ScreenWrapper'
import StandardHeader from 'components/layout/StandardHeader'
import DropdownButton from 'components/buttons/DropdownButton'
import RatingCard from 'components/cards/RatingCard'
import RatingCardSkeleton from 'components/cards/RatingCardSkeleton'
import StarRating from 'components/display/StarRating'
import {
  PullToRefreshControl,
  PullToRefreshIndicator,
} from 'components/display/PullToRefresh'

import { useLandlordStats } from 'hooks/landlord'
import { useLandlordReviewsPage, type LandlordReviewSort } from 'hooks/ratings'

const SORT_OPTIONS: LandlordReviewSort[] = [
  'Most Recent',
  'Highest Rating',
  'Lowest Rating',
]

export default function LandlordReviewsPage() {
  const { landlordId } = useLocalSearchParams<{
    landlordId?: string | string[]
  }>()
  const resolvedLandlordId = Array.isArray(landlordId) ? landlordId[0] : landlordId

  const [sortBy, setSortBy] = useState<LandlordReviewSort>('Most Recent')
  const { stats } = useLandlordStats(resolvedLandlordId)
  const {
    reviews,
    totalReviews,
    loading,
    refreshing,
    loadingMore,
    error,
    hasMore,
    fetchMore,
    refetch,
  } = useLandlordReviewsPage(resolvedLandlordId, sortBy)

  if (loading) {
    return (
      <ScreenWrapper header={<StandardHeader title="Reviews" />}>
        <View style={{ padding: 20, gap: 12 }}>
          {Array.from({ length: 4 }).map((_, index) => (
            <RatingCardSkeleton key={index} />
          ))}
        </View>
      </ScreenWrapper>
    )
  }

  return (
    <ScreenWrapper header={<StandardHeader title="Reviews" />}>
      <FlatList
        data={reviews}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 20, gap: 12, paddingBottom: 32 }}
        refreshControl={
          <PullToRefreshControl refreshing={refreshing} onRefresh={refetch} />
        }
        onEndReached={hasMore ? fetchMore : undefined}
        onEndReachedThreshold={0.4}
        ListHeaderComponent={
          <>
            <PullToRefreshIndicator refreshing={refreshing} />

            <View className="mb-2 gap-2">
              {totalReviews > 0 ? (
                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center gap-1.5">
                    {stats.averageRating > 0 ? (
                      <>
                        <StarRating rating={stats.averageRating} size={20} />
                        <Text className="text-foreground text-base font-nunitoSemiBold">
                          {stats.averageRating.toFixed(1)}
                        </Text>
                      </>
                    ) : null}
                    <Text className="text-muted text-sm font-inter">
                      · {totalReviews} {totalReviews === 1 ? 'Review' : 'Reviews'}
                    </Text>
                  </View>

                  <DropdownButton
                    label="Sort by"
                    options={SORT_OPTIONS}
                    value={sortBy}
                    onSelect={setSortBy}
                  />
                </View>
              ) : null}

              {error ? (
                <Text className="text-red-500 text-sm font-inter">{error}</Text>
              ) : null}
            </View>
          </>
        }
        ListEmptyComponent={
          <View className="items-center justify-center py-16 gap-1">
            <Text className="text-foreground text-base font-nunitoSemiBold">
              No reviews yet
            </Text>
            <Text className="text-muted text-sm font-inter text-center">
              Reviews from tenants who rented this landlord&apos;s apartments will
              appear here.
            </Text>
          </View>
        }
        ListFooterComponent={
          loadingMore ? (
            <View className="items-center justify-center py-4">
              <Spinner size="sm" accessibilityLabel="Loading more reviews" />
            </View>
          ) : null
        }
        renderItem={({ item }) => (
          <RatingCard
            name={item.name}
            date={item.date}
            rating={item.rating}
            review={item.review}
            profilePictureUrl={item.profilePictureUrl}
            apartmentName={item.apartmentName}
            images={item.images}
          />
        )}
      />
    </ScreenWrapper>
  )
}
