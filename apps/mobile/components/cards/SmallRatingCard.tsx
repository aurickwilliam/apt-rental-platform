import { View, Image, ImageSourcePropType, Text } from 'react-native'

import { IconStarFilled } from '@tabler/icons-react-native';

import { DEFAULT_IMAGES } from '../../constants/images'

import { COLORS } from '@repo/constants';

interface SmallRatingCardProps {
  accountName: string;
  profilePictureUrl?: ImageSourcePropType;
  rating: number;
  comment: string;
  date: string;
}

export default function SmallRatingCard({
  accountName,
  profilePictureUrl = DEFAULT_IMAGES.defaultProfilePicture,
  rating,
  comment,
  date
}: SmallRatingCardProps) {
  return (
    <View className='bg-darkerWhite p-3 rounded-xl'>
      <View className='flex-row items-center justify-between'>
        {/* Name and Profile Pic */}
        <View className='flex-row items-center gap-2'>
          {/* Profile Picture */}
          <View className='rounded-full size-10 overflow-hidden border border-secondary'>
            <Image 
              source={profilePictureUrl}
              style={{ width: '100%', height: '100%' }}
            />
          </View>

          {/* Name and Date */}
          <View>
            <Text className='font-interMedium text-base text-text'>
              {accountName}
            </Text>

            <Text className='font-inter text-sm text-grey-500'>
              {date}
            </Text>
          </View>
        </View>
    
        {/* Ratings */}
        <View className='flex-row items-center gap-1'>
          <Text className='font-interMedium text-base text-text'>
            {rating}
          </Text>

          <IconStarFilled 
            size={20}
            color={COLORS.secondary}
          />
        </View>
      </View>

      {/* Comment */}
      <View className='mt-3'>
        <Text className='font-inter text-sm text-text'>
          {comment}
        </Text>
      </View>
    </View>
  )
}