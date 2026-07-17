import { useState } from 'react'
import { View, Text, Pressable } from 'react-native'
import { Image } from 'expo-image'
import { Avatar, Card } from 'heroui-native'
import ImageViewing from 'react-native-image-viewing'
import { formatDate, getInitials } from '@repo/utils'
import StarRating from '../display/StarRating'

interface RatingCardProps {
  name: string
  date: string
  rating: number
  review: string
  profilePictureUrl?: string
  durationOfStay?: string
  images?: string[]
}

const REVIEW_CHAR_LIMIT = 150
const MAX_VISIBLE_THUMBNAILS = 4

export default function RatingCard({
  name,
  date,
  rating,
  review,
  profilePictureUrl,
  durationOfStay,
  images,
}: RatingCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)

  const isLongReview = review.length > REVIEW_CHAR_LIMIT
  const displayedReview =
    isLongReview && !isExpanded ? `${review.slice(0, REVIEW_CHAR_LIMIT).trimEnd()}…` : review

  const visibleThumbnails = images?.slice(0, MAX_VISIBLE_THUMBNAILS) ?? []
  const remainingCount = images ? images.length - MAX_VISIBLE_THUMBNAILS : 0
  const imageViewingSources = images?.map((uri) => ({ uri })) ?? []

  return (
    <>
      <Card className='w-full overflow-hidden rounded-3xl border border-border shadow-none p-3'>
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
          <View>
            <Text className='text-foreground text-sm font-inter'>
              {displayedReview}
            </Text>
            {isLongReview && (
              <Pressable
                onPress={() => setIsExpanded((prev) => !prev)}
                hitSlop={8}
              >
                <Text className='text-accent text-sm font-interMedium mt-1'>
                  {isExpanded ? 'Show less' : 'Read more'}
                </Text>
              </Pressable>
            )}
          </View>

          {/* Review Images */}
          {visibleThumbnails.length > 0 && (
            <View className='flex-row gap-2 mt-1'>
              {visibleThumbnails.map((uri, index) => {
                const isLastVisible = index === MAX_VISIBLE_THUMBNAILS - 1
                const showOverlay = isLastVisible && remainingCount > 0

                return (
                  <Pressable
                    key={uri + index}
                    onPress={() => setLightboxIndex(index)}
                    className='w-16 h-16 rounded-xl overflow-hidden'
                  >
                    <Image
                      source={{ uri }}
                      style={{ width: '100%', height: '100%' }}
                      contentFit='cover'
                      cachePolicy='disk'
                    />
                    {showOverlay && (
                      <View className='absolute inset-0 bg-black/50 items-center justify-center'>
                        <Text className='text-white text-sm font-interMedium'>
                          +{remainingCount}
                        </Text>
                      </View>
                    )}
                  </Pressable>
                )
              })}
            </View>
          )}

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

      <ImageViewing
        images={imageViewingSources}
        imageIndex={lightboxIndex ?? 0}
        visible={lightboxIndex !== null}
        onRequestClose={() => setLightboxIndex(null)}
      />
    </>
  )
}
