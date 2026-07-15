import { View, Text } from 'react-native'
import { Avatar, Card, PressableFeedback } from 'heroui-native'

import { formatDate, getInitials } from '@repo/utils'

import StarRating from '../display/StarRating'

interface RatingCardProps {
  name: string
  date: string
  rating: number
  review: string
  profilePictureUrl?: string
  durationOfStay?: string
  onPress?: () => void
}

export default function RatingCard({
  name,
  date,
  rating,
  review,
  profilePictureUrl,
  durationOfStay,
  onPress,
}: RatingCardProps) {

  return (
    <PressableFeedback
      onPress={onPress}
      isDisabled={!onPress}
      animation={onPress ? undefined : 'disable-all'}
      className='w-full overflow-hidden rounded-3xl border border-border shadow-none'
    >
      {onPress && <PressableFeedback.Highlight />}
      <Card className='w-full p-3'>
        <Card.Body className='gap-2 p-0'>
          <View className='flex-row items-start justify-between'>
            {/* Avatar + Name + Date */}
            <View className='flex-row items-center gap-2 flex-1 pr-3'>
              <Avatar
                size='sm'
                alt={`${name}'s profile picture`}
                className='border border-border'
              >
                {profilePictureUrl && (
                  <Avatar.Image source={{ uri: profilePictureUrl }} />
                )}
                <Avatar.Fallback className='bg-gray-100'>
                  <Text className='text-accent text-sm font-interMedium'>
                    {getInitials(name)}
                  </Text>
                </Avatar.Fallback>
              </Avatar>

              <View className='flex-1'>
                <Text
                  className='text-foreground text-sm font-interMedium'
                  numberOfLines={1}
                >
                  {name}
                </Text>
                <Text className='text-muted text-xs font-inter'>
                  {formatDate(date, 'medium')}
                </Text>
              </View>
            </View>
            {/* Star Rating */}
            <View className='flex-row items-center gap-1'>
              <StarRating rating={rating} size={14} />
              <Text className='text-foreground text-sm font-interMedium'>
                {rating.toFixed(1)}
              </Text>
            </View>
          </View>

          {/* Review Text */}
          <Text className='text-foreground text-sm font-inter'>
            {review}
          </Text>

          {/* Duration of Stay */}
          {durationOfStay && (
            <View className='flex-row items-center gap-1'>
              <Text className='text-gray-500 text-xs font-inter'>
                {durationOfStay}
              </Text>
            </View>
          )}
        </Card.Body>
      </Card>
    </PressableFeedback>
  )
}
