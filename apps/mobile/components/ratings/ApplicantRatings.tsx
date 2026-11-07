import { Text, View } from 'react-native'
import { useRouter } from 'expo-router'
import { Button, Spinner } from 'heroui-native'
import { IconChevronRight, IconStar } from '@tabler/icons-react-native'
import {
  APPLICANT_RATINGS_PREVIEW_LIMIT,
  describeTenantRatingSummary,
  formatStayRange,
} from '@repo/utils'

import RatingCard from '@/components/cards/RatingCard'
import EmptyState from '@/components/display/EmptyState'
import StarRating from '@/components/display/StarRating'
import { useTenantReviews } from '@/hooks/ratings'
import { useColors } from '@/hooks/useTheme'

interface ApplicantRatingsProps {
  tenantId: string
  tenantName: string
}

/**
 * Landlord ratings of an applicant, for the application detail screen. It loads on its
 * own: a failed read shows a small retry here and never blocks approving or rejecting.
 */
export default function ApplicantRatings({ tenantId, tenantName }: ApplicantRatingsProps) {
  const { colors } = useColors()
  const router = useRouter()
  const { reviews, average, count, loading, isError, refetch } = useTenantReviews(tenantId)

  const openProfile = () =>
    router.push({ pathname: '/profile/tenant/[tenantId]', params: { tenantId } })

  if (loading) {
    return (
      <View className="items-center py-4" accessibilityRole="progressbar" accessibilityLabel="Loading ratings">
        <Spinner size="sm" color={colors.primary} />
      </View>
    )
  }

  if (isError) {
    return (
      <View
        className="bg-danger/10 border border-danger/20 rounded-2xl p-4 gap-3"
        accessibilityRole="alert"
      >
        <Text className="text-danger text-sm font-inter">
          Could not load this tenant&apos;s ratings. You can still review and decide on the application.
        </Text>
        <Button size="sm" variant="secondary" className="self-start" onPress={() => void refetch()}>
          <Button.Label>Try Again</Button.Label>
        </Button>
      </View>
    )
  }

  if (count === 0) {
    return (
      <EmptyState
        className="py-4"
        icon={IconStar}
        title="No ratings yet"
        description={`No landlord has rated ${tenantName} yet. Landlords can rate a tenant once their lease has ended.`}
      />
    )
  }

  const preview = reviews.slice(0, APPLICANT_RATINGS_PREVIEW_LIMIT)

  return (
    <View className="gap-4">
      <View className="flex-row items-center gap-3">
        <Text className="text-foreground text-3xl font-nunitoBold">{average.toFixed(1)}</Text>
        <View className="gap-1">
          <StarRating rating={average} size={18} className="flex-row gap-0.5" />
          <Text className="text-muted text-sm font-inter">
            {describeTenantRatingSummary({ average, count })}
          </Text>
        </View>
      </View>

      <View className="gap-3">
        {preview.map((review) => (
          <RatingCard
            key={review.id}
            name={review.landlordName}
            date={review.createdAt}
            rating={review.rating}
            review={review.comment}
            profilePictureUrl={review.landlordAvatarUrl ?? undefined}
            apartmentName={review.apartmentName ?? undefined}
            durationOfStay={review.leaseStart ? formatStayRange(review.leaseStart, review.leaseEnd) : undefined}
          />
        ))}
      </View>

      {count > preview.length ? (
        <Text className="text-muted text-sm font-inter">
          Showing the {preview.length} most recent of {count} ratings.
        </Text>
      ) : null}

      <Button variant="tertiary" size="sm" className="self-start" onPress={openProfile}>
        <Button.Label className="text-accent font-nunitoSemiBold">View full profile</Button.Label>
        <IconChevronRight size={16} color={colors.primary} />
      </Button>
    </View>
  )
}
