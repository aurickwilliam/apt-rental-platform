import { View } from 'react-native'
import ReanimatedSwipeable from 'react-native-gesture-handler/ReanimatedSwipeable'

import { IconCheck } from '@tabler/icons-react-native'

import { Button } from 'heroui-native'

import { getRelativeTime } from '@repo/utils'

import type { ConversationWithMeta } from '@/service/chat/conversationService'

import MessageCard from './MessageCard'

interface ConversationRowProps {
  conversation: ConversationWithMeta;
  onOpen: (c: ConversationWithMeta) => void;
  onMarkRead: (conversationKey: string) => void;
}

/**
 * Full-bleed conversation row with swipe-right Mark read.
 * The -mx-5 breaks the row out of the screen's p-5 so the swipe track spans
 * edge-to-edge; the card's own px-5 keeps text aligned with the rest.
 * Read rows render without the swipeable so gestures never interfere.
 */
export default function ConversationRow({
  conversation,
  onOpen,
  onMarkRead,
}: ConversationRowProps) {
  const card = (
    <MessageCard
      name={conversation.other_user_name}
      apartmentName={conversation.apartment_name ?? 'Unknown Property'}
      lastMessage={conversation.last_message}
      messageType={conversation.last_message_type}
      isUserLastSender={Boolean(conversation.last_sender_is_me)}
      timestamp={getRelativeTime(new Date(conversation.last_message_time))}
      unreadCount={conversation.unread_count}
      profilePictureUrl={conversation.other_user_avatar ?? undefined}
      onPress={() => onOpen(conversation)}
      onMarkRead={() => onMarkRead(conversation.conversation_key)}
    />
  );

  if (conversation.unread_count <= 0) {
    return <View className='-mx-5'>{card}</View>;
  }

  return (
    <View className='-mx-5'>
    <ReanimatedSwipeable
      friction={2}
      leftThreshold={40}
      overshootLeft={false}
      renderLeftActions={() => (
        <Button
          size='sm'
          onPress={() => onMarkRead(conversation.conversation_key)}
          className='w-24 h-full rounded-3xl flex-col'
        >
          <IconCheck size={20} color='#FFFFFF' />
          <Button.Label>Mark read</Button.Label>
        </Button>
      )}
    >
      {card}
    </ReanimatedSwipeable>
    </View>
  );
}
