import { createElement } from 'react';
import { View, Text } from 'react-native'
import { Avatar, PressableFeedback } from 'heroui-native'

import {
  IconGif,
  IconPhoto,
  IconPlayerPlayFilled,
} from '@tabler/icons-react-native'

import { useColors } from '@/hooks/useTheme'

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
  /** Touch-free mirror of the swipe "Mark read" action (screen readers can't swipe). */
  onMarkRead?: () => void;
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
  onPress,
  onMarkRead
}: MessageCardProps) {
  const { colors } = useColors();

  const hasUnread = unreadCount > 0;
  const showMarkReadAction = hasUnread && onMarkRead !== undefined;
  const rawDisplay = getLastMessageDisplay(lastMessage, messageType, isUserLastSender);
  const displayMessage = lastMessage && isUserLastSender && rawDisplay ? `You: ${rawDisplay}` : rawDisplay;
  // Text fallback rows have no message body — an icon names the attachment kind.
  const attachmentIcon = !lastMessage
    ? messageType === 'video'
      ? IconPlayerPlayFilled
      : messageType === 'gif'
        ? IconGif
        : messageType === 'image'
          ? IconPhoto
          : null
    : null;
  const unreadLabel = hasUnread
    ? `, ${unreadCount > 99 ? '99+' : unreadCount} unread messages`
    : '';

  return (
    <PressableFeedback
      onPress={onPress}
      className='overflow-hidden rounded-3xl'
      accessibilityRole='button'
      accessibilityLabel={`Chat with ${name} about ${apartmentName}${unreadLabel}`}
      accessibilityHint='Opens conversation'
      accessibilityActions={
        showMarkReadAction ? [{ name: 'markRead', label: 'Mark as read' }] : undefined
      }
      onAccessibilityAction={(event) => {
        if (showMarkReadAction && event.nativeEvent.actionName === 'markRead') {
          onMarkRead?.();
        }
      }}
    >
      <PressableFeedback.Highlight />
      <View className='flex-row items-center gap-3 px-5 py-3 bg-background rounded-3xl'>

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
        <View className='flex-1'>
          <View className='flex-row items-center gap-2'>
            <Text
              className={`flex-1 text-foreground text-sm ${hasUnread ? 'font-nunitoBold' : 'font-nunitoSemiBold'}`}
              numberOfLines={1}
            >
              {name}
            </Text>
            <Text className={`text-gray-500 text-xs font-inter ${hasUnread ? 'font-semibold' : ''}`}>
              {timestamp}
            </Text>
          </View>

          <Text className='text-gray-500 text-xs font-inter' numberOfLines={1}>
            {apartmentName}
          </Text>

          <View className='flex-row justify-start items-center gap-2'>
            {attachmentIcon ? (
              <View accessibilityElementsHidden>
                {createElement(attachmentIcon, { size: 14, color: colors.gray500 })}
              </View>
            ) : null}
            <Text
              className={`text-foreground text-xs font-inter flex-1 ${hasUnread ? 'font-semibold' : ''}`}
              numberOfLines={1}
            >
              {displayMessage}
            </Text>
          </View>
        </View>

      </View>
    </PressableFeedback>
  )
}
