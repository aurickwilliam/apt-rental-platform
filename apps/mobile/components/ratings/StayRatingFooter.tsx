import { Text, View } from 'react-native'
import { PressableFeedback } from 'heroui-native'
import { IconChevronRight, IconStar } from '@tabler/icons-react-native'

import StarRating from '@/components/display/StarRating'
import { useColors } from '@/hooks/useTheme'

interface StayRatingFooterProps {
  /** The landlord's saved rating for this stay, or null when they have not rated it yet. */
  rating: number | null
  onPress: () => void
}

/** The rating row inside a past-stay card: rate the tenant, or see and edit the saved rating. */
export default function StayRatingFooter({ rating, onPress }: StayRatingFooterProps) {
  const { colors } = useColors()
  const isRated = rating !== null

  return (
    <PressableFeedback
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={isRated ? `Your rating ${rating} out of 5. Edit` : 'Rate this tenant'}
      className="rounded-2xl"
    >
      <PressableFeedback.Ripple />
      <View className="flex-row items-center justify-between gap-3 px-1 py-1">
        {isRated ? (
          <View className="flex-row items-center gap-2">
            <StarRating rating={rating} size={16} className="flex-row gap-0.5" />
            <Text className="text-foreground text-sm font-nunitoSemiBold">Your rating · {rating}/5</Text>
          </View>
        ) : (
          <View className="flex-row items-center gap-2">
            <IconStar size={18} color={colors.rating} />
            <Text className="text-foreground text-sm font-nunitoSemiBold">Rate this tenant</Text>
          </View>
        )}

        <View className="flex-row items-center gap-0.5">
          <Text className="text-accent text-sm font-nunitoSemiBold">{isRated ? 'Edit' : 'Rate'}</Text>
          <IconChevronRight size={16} color={colors.primary} />
        </View>
      </View>
    </PressableFeedback>
  )
}
