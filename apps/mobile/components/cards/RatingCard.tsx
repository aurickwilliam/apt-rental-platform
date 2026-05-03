import { View, Text, Image } from 'react-native'

import { COLORS } from '@repo/constants';
import { DEFAULT_IMAGES } from 'constants/images';

import { IconStar, IconStarFilled } from '@tabler/icons-react-native';

interface RatingCardProps {
  name: string;
  date: string;
  rating: number;
  review: string;
  profilePictureUrl?: string;
  durationOfStay?: string;
}

export default function RatingCard({
  name,
  date,
  rating,
  review,
  profilePictureUrl,
  durationOfStay,
}: RatingCardProps) {

  // TODO: Format date to relative time (e.g., "2 weeks ago")

  const profileImage = profilePictureUrl ? { uri: profilePictureUrl } : DEFAULT_IMAGES.defaultProfilePicture;

  return (
    <View className='w-full'>
      <View className='flex-row items-center justify-between'>
        {/* Profile and Name and Rating */}
        <View className='flex-row items-center gap-2'>
          <View className='size-12 rounded-full overflow-hidden border border-secondary'>
            <Image 
              source={profileImage}
              style={{
                width: '100%',
                height: '100%',
              }}
            />
          </View>

          <View className='flex'>
            <Text className='text-text text-base font-interMedium'>
              {name}
            </Text>

            <View className='flex-row gap-1 items-center'>
              <View className='flex-row gap-1'>
                {[1, 2, 3, 4, 5].map((star) => (
                  star <= Math.round(rating) ? (
                    <IconStarFilled 
                      key={star} 
                      size={16} 
                      color={COLORS.secondary} 
                    />
                  ) : (
                    <IconStar 
                      key={star} 
                      size={16} 
                      color={COLORS.secondary} 
                    />
                  )
                ))}
              </View>

              <Text className='text-text text-sm font-interMedium'>
                {rating}/5
              </Text>
            </View>
          </View>
        </View>

        {/* Date Stamp */}
        <View>
          <Text className='text-sm text-text font-inter'>
            {date}
          </Text>
        </View>
      </View>

      {/* Review Text */}
      <View className='mt-2'>
        <Text className='text-text text-base font-inter'>
          {review}
        </Text>
      </View>

      {/* Duration of Stay */}
      {durationOfStay && (
        <View className='mt-2'>
          <Text className='text-grey-500 text-sm font-interItalic'>
            {durationOfStay}
          </Text>
        </View>
      )}
    </View>
  )
}