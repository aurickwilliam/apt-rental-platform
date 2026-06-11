import { Image, View } from 'react-native'
import { Avatar, Text } from 'heroui-native';

import { COLORS } from "@repo/constants";

type ProfileHeaderProps = {
  backgroundPhotoUri?: string | null
  avatarUrl?: string | null
  firstName?: string | null
  lastName?: string | null
  email?: string | null
  avatarInitials?: string
  loading?: boolean
}

export function ProfileHeader({
  backgroundPhotoUri,
  avatarUrl,
  firstName,
  lastName,
  email,
  avatarInitials,
  loading = false,
}: ProfileHeaderProps) {
  
  const fullName = loading ? '...' : `${firstName} ${lastName}`
  const displayEmail = loading ? '...' : email

  return (
    <View className='relative h-90'>
      {/* Background Photo */}
      <View 
        className='w-full h-60 rounded-b-3xl overflow-hidden' 
        style={{ backgroundColor: backgroundPhotoUri ? 'transparent' : COLORS.grey }}
      >
        {backgroundPhotoUri && (
          <Image
            source={{ uri: backgroundPhotoUri }}
            style={{ width: '100%', height: '100%' }}
          />
        )}
      </View>

      {/* Profile Picture */}
      <View className='absolute top-32 left-0 right-0 items-center'>
        <Avatar
          size="lg"
          color="accent"
          className="size-36 border-4 border-darkerWhite mb-3"
          alt={fullName}
        >
          <Avatar.Image source={{ uri: avatarUrl ?? '' }} />
          <Avatar.Fallback delayMs={200}>
            {avatarInitials ?? ''}
          </Avatar.Fallback>
        </Avatar>

        {/* Name and Email */}
        <View className='flex items-center justify-center'>
          <Text className='text-text text-xl font-interSemiBold'>
            {fullName}
          </Text>

          <Text className='text-grey-500 text-lg font-inter'>
            {displayEmail}
          </Text>
        </View>
      </View>
    </View>
  )
}