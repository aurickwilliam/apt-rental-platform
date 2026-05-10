import { View, Text, TouchableOpacity } from 'react-native';
import { IconStar } from '@tabler/icons-react-native';

import SmallRatingCard from 'components/cards/SmallRatingCard';
import { COLORS } from '@repo/constants';
import type { ReviewWithTenant } from '@/hooks/useApartmentDetails';

type RatingsSectionProps = {
  reviews: ReviewWithTenant[];
  onSeeAll?: () => void;
};

export default function RatingsSection({ reviews, onSeeAll }: RatingsSectionProps) {
  const hasReviews = reviews.length > 0;

  return (
    <>
      <View className='px-5 mt-10 flex-row items-center justify-between'>
        <View className='flex-row items-center gap-2'>
          <IconStar size={26} color={COLORS.text} />
          <Text className='font-poppinsSemiBold text-xl text-text'>Ratings</Text>
        </View>

        {hasReviews && onSeeAll && (
          <TouchableOpacity activeOpacity={0.7} onPress={onSeeAll}>
            <Text className='font-interMedium text-base text-primary'>
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
              rating={review.rating}
              comment={review.comment ?? ''}
              date={new Date(review.created_at).toLocaleDateString('en-PH', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            />
          ))
        ) : (
          <View className='items-center py-8 opacity-70'>
            <IconStar size={32} color={COLORS.grey} />
            <Text className='mt-2 text-grey-500 font-interMedium'>
              No ratings yet
            </Text>
          </View>
        )}
      </View>
    </>
  );
}
