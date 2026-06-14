import { View, Text } from 'react-native'
import { Avatar, Card, PressableFeedback } from 'heroui-native'

interface MessageCardProps {
  name: string;
  apartmentName: string;
  lastMessage: string;
  timestamp: string;
  profilePictureUrl?: string;
  isUserLastSender?: boolean;
  unreadCount?: number;
  onPress?: () => void;
}

export default function MessageCard({
  name,
  apartmentName,
  lastMessage,
  timestamp,
  profilePictureUrl,
  isUserLastSender = false,
  unreadCount = 0,
  onPress
}: MessageCardProps) {

  return (
    <PressableFeedback onPress={onPress} className='rounded-3xl overflow-hidden border border-border'>
      <PressableFeedback.Highlight />
      <Card className='flex-row gap-4 shadow-none rounded-3xl'>

        {/* Profile Picture */}
        <View className='relative'>
          <Avatar size='lg' className='border border-secondary'>
            <Avatar.Image source={{ uri: profilePictureUrl }} />
            <Avatar.Fallback delayMs={200}>
              {name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
            </Avatar.Fallback>
          </Avatar>

          {unreadCount > 0 && (
            <View className='absolute -top-1 -right-1 bg-accent rounded-full min-w-5 h-5 px-1 items-center justify-center'>
              <Text className='text-white text-xs font-interMedium'>
                {unreadCount > 99 ? '99+' : unreadCount}
              </Text>
            </View>
          )}
        </View>

        {/* Message Details */}
        <View className='flex-1 justify-between'>
          <View>
            <Text className='font-interMedium text-foreground text-sm'>
              {name}
            </Text>
            <Text className='text-gray-500 text-xs font-inter'>
              {apartmentName}
            </Text>
          </View>

          <View className='flex-row justify-start items-center gap-2'>
            <Text
              className='text-foreground text-xs font-inter flex-1'
              numberOfLines={1}
            >
              {isUserLastSender ? `You: ${lastMessage}` : lastMessage}
            </Text>

            <Text className='text-gray-500 text-xs font-inter'>
              {timestamp}
            </Text>
          </View>
        </View>

      </Card>
    </PressableFeedback>
  )
}