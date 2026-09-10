import { View, Text } from 'react-native'
import { Avatar, Card, PressableFeedback } from 'heroui-native'

function getLastMessageDisplay(
  lastMessage: string | null,
  messageType?: string | null,
  isUserLastSender?: boolean
): string {
  if (lastMessage) return lastMessage;

  switch (messageType) {
    case 'image':
      return isUserLastSender ? 'You sent a photo' : 'Sent a photo';
    case 'video':
      return isUserLastSender ? 'You sent a video' : 'Sent a video';
    case 'gif':
      return isUserLastSender ? 'You sent a GIF' : 'Sent a GIF';
    default:
      return '';
  }
}

interface MessageCardProps {
  name: string;
  apartmentName: string;
  lastMessage: string | null;
  messageType?: string | null;
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
  messageType,
  timestamp,
  profilePictureUrl,
  isUserLastSender = false,
  unreadCount = 0,
  onPress
}: MessageCardProps) {
  const rawDisplay = getLastMessageDisplay(lastMessage, messageType, isUserLastSender);
  const displayMessage = lastMessage && isUserLastSender && rawDisplay ? `You: ${rawDisplay}` : rawDisplay;

  return (
    <PressableFeedback onPress={onPress} className='rounded-3xl overflow-hidden border border-border'>
      <PressableFeedback.Highlight />
      <Card className='flex-row gap-4 shadow-none rounded-3xl'>

        {/* Profile Picture */}
        <View className='relative'>
          <Avatar size='lg' className='border border-border rounded-full overflow-hidden'>
            {profilePictureUrl ? (
              <Avatar.Image source={{ uri: profilePictureUrl }} />
            ) : null}
            <Avatar.Fallback delayMs={200} className="rounded-full">
              {name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
            </Avatar.Fallback>
          </Avatar>

          {unreadCount > 0 && (
            <View className='absolute -top-1 -right-1 bg-accent rounded-full min-w-5 h-5 px-1 items-center justify-center'>
              <Text className='text-white text-xs font-nunitoSemiBold'>
                {unreadCount > 99 ? '99+' : unreadCount}
              </Text>
            </View>
          )}
        </View>

        {/* Message Details */}
        <View className='flex-1 justify-between'>
          <View>
            <Text className='font-nunitoSemiBold text-foreground text-sm'>
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
              {displayMessage}
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
