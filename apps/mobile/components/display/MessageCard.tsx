import { View, Text, Image, TouchableOpacity } from 'react-native'

import { IMAGES } from '../../constants/images'

interface MessageCardProps {
  name: string;
  apartmentName: string;
  lastMessage: string;
  timestamp: string;
  profilePictureUrl?: string;
  isUserLastSender?: boolean;
}

export default function MessageCard({
  name,
  apartmentName,
  lastMessage,
  timestamp,
  profilePictureUrl,
  isUserLastSender = false,
}: MessageCardProps) {

  const profilePicture = profilePictureUrl ? { uri: profilePictureUrl } : IMAGES.defaultProfilePicture;

  // TODO: Implement a function to return a timestamp relative to the current time
  // e.g., "2 hours ago", "Yesterday", etc.

  return (
    <TouchableOpacity 
      activeOpacity={0.7}
      className='bg-white p-4 rounded-2xl flex-row gap-4'
    >
      {/* Profile Picture */}
      <View className='size-20 rounded-full overflow-hidden border-2 border-secondary'>
        <Image 
          source={profilePicture}
          style={{
            width: '100%',
            height: '100%',
          }}
        />
      </View>

      {/* Message Details */}
      <View className='flex-1 justify-between'>
        <View>
          <Text className='font-interMedium text-base'>
            {name}
          </Text>
          <Text className='text-grey-500 text-sm font-inter'>
            {apartmentName}
          </Text>
        </View>
        
        <View className='flex-row justify-start items-center gap-2'>
          <Text 
            className='text-text text-base font-inter flex-1' 
            numberOfLines={1}
          >
            {isUserLastSender ? `You: ${lastMessage}` : lastMessage}
          </Text>

          <Text className='text-gray-500 text-sm font-inter'>
            {timestamp}
          </Text>
        </View>
      </View>    
    </TouchableOpacity>
  )
}