import { View, Text, TouchableOpacity } from 'react-native';

import { IconStarFilled, IconStar } from '@tabler/icons-react-native';

import SmallRatingCard from 'components/cards/SmallRatingCard';

import { useColors } from 'hooks/useTheme';
import type { ReviewWithTenant } from 'hooks/apartments';

import { formatDate } from '@repo/utils';

type RatingsSectionProps = {
  reviews: ReviewWithTenant[];
  onSeeAll?: () => void;
};

export default function RatingsSection({ reviews, onSeeAll }: RatingsSectionProps) {
  const { colors } = useColors();
  const hasReviews = reviews.length > 0;

  return (
    <>
      <View className='px-5 mt-10 flex-row items-center justify-between'>
        <View className='flex-row items-center gap-2'>
          <IconStarFilled size={26} color={colors.secondary} />
          <Text className='font-interSemiBold text-lg text-foreground'>
            Ratings
          </Text>
        </View>
        {hasReviews && onSeeAll && (
          <TouchableOpacity activeOpacity={0.7} onPress={onSeeAll}>
            <Text className='font-interMedium text-sm text-accent'>
              See All
            </Text>
          </TouchableOpacity>
        )}
      </View>

      <View className='mt-5 px-5 flex gap-3'>
        {hasReviews ? (
          reviews.map((review) => (
            <SmallRatingCard
              key={review.id}
              accountName={`${review.tenant?.first_name} ${review.tenant?.last_name}`}
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
              <IconStar size={24} color={colors.gray400} strokeWidth={1.75} />
            </View>
            <Text className='font-interSemiBold text-base text-foreground'>
              No ratings yet
            </Text>
            <Text className='mt-1 text-sm text-gray500 font-interMedium text-center leading-5'>
              This place hasn&apos;t been reviewed. Ratings will appear here once a tenant shares their experience.
            </Text>
          </View>
        )}
      </View>
    </>
  );
}
