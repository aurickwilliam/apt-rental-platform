import { View, Text, TouchableOpacity } from 'react-native';

import { Star } from 'lucide-react-native';

import SmallRatingCard from 'components/cards/SmallRatingCard';

import { useColors } from 'hooks/useTheme';
import type { ReviewWithTenant } from 'hooks/apartments';

type RatingsSectionProps = {
  reviews: ReviewWithTenant[];
  onSeeAll?: () => void;
};

export default function RatingsSection({ reviews, onSeeAll }: RatingsSectionProps) {
  const {colors} = useColors();

  const hasReviews = reviews.length > 0;

  return (
    <>
      <View className='px-5 mt-10 flex-row items-center justify-between'>
        <View className='flex-row items-center gap-2'>
          <Star size={26} color={colors.textPrimary} />
          <Text className='font-interSemiBold text-lg text-foreground'>
            Ratings
          </Text>
        </View>

        {hasReviews && onSeeAll && (
          <TouchableOpacity activeOpacity={0.7} onPress={onSeeAll}>
            <Text className='font-interMedium text-base text-accent'>
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
            <Star size={32} color={colors.gray500}/>
            <Text className='mt-2 text-gray-500 font-interMedium'>
              No ratings yet
            </Text>
          </View>
        )}
      </View>
    </>
  );
}
