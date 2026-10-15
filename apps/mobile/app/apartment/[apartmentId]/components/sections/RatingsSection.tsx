import { View, Text } from 'react-native';

import {
  IconStarFilled,
  IconStarOff,
  IconHomeStar
} from '@tabler/icons-react-native';

import SmallRatingCard from 'components/cards/SmallRatingCard';

import { useColors } from 'hooks/useTheme';
import SectionHeader, { SeeAllButton } from '@/components/display/SectionHeader';
import type { ReviewWithTenant } from 'hooks/apartments';

import { formatDate } from '@repo/utils';

import { Button, SkeletonGroup } from 'heroui-native';

type RatingsSectionProps = {
  reviews: ReviewWithTenant[];
  isLoading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  onSeeAll?: () => void;
  canReview?: boolean;
  checkingEligibility?: boolean;
  onWriteReview?: () => void;
};

export default function RatingsSection({
  reviews,
  isLoading = false,
  error = null,
  onRetry,
  onSeeAll,
  canReview = false,
  checkingEligibility = false,
  onWriteReview,
}: RatingsSectionProps) {
  const { colors } = useColors();
  const hasReviews = reviews.length > 0;
  const showWriteReviewCta = !checkingEligibility && canReview && !!onWriteReview;

  return (
    <>
      <SectionHeader
        icon={<IconStarFilled size={26} color={colors.rating} />}
        title="Ratings"
        className='px-5'
        action={
          hasReviews && onSeeAll ? <SeeAllButton onPress={onSeeAll} /> : undefined
        }
      />
      <View className='mt-3 px-5 flex gap-3'>
        {isLoading && !hasReviews ? (
          <SkeletonGroup isLoading>
            <SkeletonGroup.Item className='h-24 w-full rounded-2xl' />
          </SkeletonGroup>
        ) : error && !hasReviews ? (
          <View className='items-center py-5 px-6'>
            <Text className='font-nunitoSemiBold text-base text-foreground'>
              Couldn&apos;t load ratings
            </Text>
            <Text className='mt-1 text-sm text-gray-500 font-nunitoSemiBold text-center'>
              Please check your connection and try again.
            </Text>
            {onRetry && (
              <Button className='mt-4' size='sm' variant='secondary' onPress={onRetry}>
                <Button.Label>Try Again</Button.Label>
              </Button>
            )}
          </View>
        ) : hasReviews ? (
          reviews.map((review) => (
            <SmallRatingCard
              key={review.id}
              accountName={
                [review.tenant?.first_name, review.tenant?.last_name]
                  .filter(Boolean)
                  .join(' ') || 'Anonymous'
              }
              profilePictureUrl={review.tenant?.avatar_url ?? undefined}
              rating={review.rating}
              comment={review.comment ?? ''}
              date={formatDate(review.created_at, 'medium')}
            />
          ))
        ) : (
          <View className='items-center py-5 px-6'>
            <View
              className='items-center justify-center rounded-full mb-3'
              style={{ width: 52, height: 52, backgroundColor: colors.gray100 }}
            >
              <IconStarOff size={24} color={colors.gray400} strokeWidth={1.75} />
            </View>

            <Text className='font-nunitoSemiBold text-base text-foreground'>
              No ratings yet
            </Text>

            <Text className='mt-1 text-sm text-gray-500 font-nunitoSemiBold text-center leading-5'>
              This place hasn&apos;t been reviewed. Ratings will appear here once a tenant shares their experience.
            </Text>

            {showWriteReviewCta && (
              <Button
                className='mt-4'
                onPress={onWriteReview}
                size="sm"
                variant='secondary'
              >
                <IconHomeStar size={18} color={colors.primary} />
                <Button.Label>
                  Be the First to Review
                </Button.Label>
              </Button>
            )}
          </View>
        )}
      </View>
    </>
  );
}
