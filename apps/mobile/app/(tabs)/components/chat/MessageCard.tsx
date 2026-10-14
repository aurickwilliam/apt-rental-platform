import { createElement } from 'react';
import { View, Text } from 'react-native'
import { Avatar, PressableFeedback } from 'heroui-native'

import {
  IconBellOff,
  IconGif,
  IconPhoto,
  IconPinFilled,
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

// Same hold delay as chat bubbles.
const LONG_PRESS_DELAY_MS = 350;

/** A row action screen readers can run without swiping. */
export interface MessageCardAction {
  name: string;
  label: string;
  onPress: () => void;
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
  /** Marked unread by the user (shows a dot when there's no unread count). */
  isMarkedUnread?: boolean;
  isPinned?: boolean;
  isMuted?: boolean;
  onPress?: () => void;
  /** Hold the card (opens the conversation's options). */
  onLongPress?: () => void;
  /** Touch-free mirror of the swipe actions (screen readers can't swipe). */
  actions?: MessageCardAction[];
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
  isMarkedUnread = false,
  isPinned = false,
  isMuted = false,
  onPress,
  onLongPress,
  actions = [],
}: MessageCardProps) {
  const { colors } = useColors();

  const hasUnread = unreadCount > 0 || isMarkedUnread;
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
  const unreadLabel =
    unreadCount > 0
      ? `, ${unreadCount > 99 ? '99+' : unreadCount} unread messages`
      : isMarkedUnread
        ? ', marked unread'
        : '';
  const stateLabel = `${isPinned ? ', pinned' : ''}${isMuted ? ', muted' : ''}`;

  return (
    <PressableFeedback
      onPress={onPress}
      onLongPress={onLongPress}
      delayLongPress={LONG_PRESS_DELAY_MS}
      className='overflow-hidden rounded-3xl'
      accessibilityRole='button'
      accessibilityLabel={`Chat with ${name} about ${apartmentName}${unreadLabel}${stateLabel}`}
      accessibilityHint={onLongPress ? 'Opens conversation. Hold for more options' : 'Opens conversation'}
      accessibilityActions={
        actions.length > 0
          ? actions.map(({ name: actionName, label }) => ({ name: actionName, label }))
          : undefined
      }
      onAccessibilityAction={(event) => {
        actions.find((action) => action.name === event.nativeEvent.actionName)?.onPress();
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

          {unreadCount > 0 ? (
            <View className='absolute -top-1 -right-1 bg-accent rounded-full min-w-5 h-5 px-1 items-center justify-center'>
              <Text className='text-white text-xs font-nunitoSemiBold'>
                {unreadCount > 99 ? '99+' : unreadCount}
              </Text>
            </View>
          ) : isMarkedUnread ? (
            <View
              className='absolute top-0 right-0 bg-accent rounded-full size-3.5 border-2 border-background'
              accessibilityElementsHidden
            />
          ) : null}
        </View>

        {/* Message Details */}
        <View className='flex-1'>
          <View className='flex-row items-center gap-2'>
            <Text
              className={`shrink text-foreground text-sm ${hasUnread ? 'font-nunitoBold' : 'font-nunitoSemiBold'}`}
              numberOfLines={1}
            >
              {name}
            </Text>
            {isMuted ? (
              <View accessibilityElementsHidden>
                <IconBellOff size={14} color={colors.gray500} />
              </View>
            ) : null}
            {isPinned ? (
              <View accessibilityElementsHidden>
                <IconPinFilled size={14} color={colors.gray500} />
              </View>
            ) : null}
            <View className='flex-1' />
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
