import { View } from 'react-native'
import {
  IconStarFilled,
  IconStarHalfFilled,
  IconStar
} from '@tabler/icons-react-native'

import { useColors } from 'hooks/useTheme'

interface StarRatingProps {
  rating: number
  maxStars?: number
  size?: number
  color?: string
  className?: string
}

export default function StarRating({
  rating,
  maxStars = 5,
  size = 16,
  color,
  className = 'flex-row gap-1',
}: StarRatingProps) {
  const { colors } = useColors()

  const starColor = color ?? colors.secondary
  const clampedRating = Math.max(0, Math.min(rating, maxStars))

  return (
    <View className={className}>
      {Array.from({ length: maxStars }, (_, i) => i + 1).map((star) => {
        const diff = clampedRating - star + 1

        if (diff >= 1) {
          return <IconStarFilled key={star} size={size} color={starColor} />
        } else if (diff >= 0.5) {
          return <IconStarHalfFilled key={star} size={size} color={starColor} />
        } else {
          return <IconStar key={star} size={size} color={starColor} />
        }
      })}
    </View>
  )
}
