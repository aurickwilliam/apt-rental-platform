import { View, Text } from 'react-native'
import ReanimatedSwipeable, {
  type SwipeableMethods,
} from 'react-native-gesture-handler/ReanimatedSwipeable'

import {
  IconArchive,
  IconArchiveOff,
  IconDots,
  IconPin,
  IconPinnedOff,
  type Icon,
} from '@tabler/icons-react-native'

import * as Haptics from 'expo-haptics'

import { PressableFeedback } from 'heroui-native'

import { getRelativeTime } from '@repo/utils'

import { useColors } from '@/hooks/useTheme'
import type { ConversationWithMeta } from '@/service/chat/conversationService'

import MessageCard, { type MessageCardAction } from './MessageCard'

// Each swipe action is a 56pt circle with its label underneath.
const ACTION_WIDTH = 76;
const ACTION_CIRCLE_SIZE = 56;
const ACTION_ICON_SIZE = 24;
const DISABLED_ACTION_OPACITY = 0.4;

interface ConversationRowProps {
  conversation: ConversationWithMeta;
  onOpen: (conversation: ConversationWithMeta) => void;
  onMore: (conversation: ConversationWithMeta, options: { isPinLocked: boolean }) => void;
  onTogglePin: (conversation: ConversationWithMeta) => void;
  onToggleArchive: (conversation: ConversationWithMeta) => void;
  /**
   * Pinned by the app (the current landlord): it always stays on top, so Pin
   * and Archive are shown but disabled.
   */
  isPinLocked?: boolean;
}

interface SwipeActionProps {
  label: string;
  icon: Icon;
  color: string;
  onPress: () => void;
  isDisabled?: boolean;
}

function SwipeAction({ label, icon: ActionIcon, color, onPress, isDisabled = false }: SwipeActionProps) {
  return (
    <PressableFeedback
      onPress={onPress}
      isDisabled={isDisabled}
      accessibilityRole='button'
      accessibilityLabel={label}
      accessibilityState={{ disabled: isDisabled }}
      className='items-center justify-center'
      style={{ width: ACTION_WIDTH, opacity: isDisabled ? DISABLED_ACTION_OPACITY : 1 }}
    >
      <View
        className='items-center justify-center rounded-full'
        style={{ width: ACTION_CIRCLE_SIZE, height: ACTION_CIRCLE_SIZE, backgroundColor: color }}
      >
        <ActionIcon size={ACTION_ICON_SIZE} color='#FFFFFF' />
      </View>
      <Text className='mt-1 text-xs text-foreground font-inter' numberOfLines={1}>
        {label}
      </Text>
    </PressableFeedback>
  );
}

/**
 * Full-bleed conversation row. Swiping left reveals More, Pin and Archive
 * (Messenger-style); screen readers get the same actions on the card.
 * The -mx-5 breaks the row out of the list's horizontal padding so the swipe
 * track spans edge-to-edge; the card's own px-5 keeps text aligned.
 */
export default function ConversationRow({
  conversation,
  onOpen,
  onMore,
  onTogglePin,
  onToggleArchive,
  isPinLocked = false,
}: ConversationRowProps) {
  const { colors } = useColors();

  const isPinned = isPinLocked || conversation.is_pinned;
  const isArchived = conversation.is_archived && !isPinLocked;
  const pinLabel = isPinned ? 'Unpin' : 'Pin';
  const archiveLabel = isArchived ? 'Unarchive' : 'Archive';

  const openMore = () => onMore(conversation, { isPinLocked });

  // Holding the row opens the same options as the More button.
  const handleLongPress = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {
      /* Haptics are optional on unsupported devices. */
    });
    openMore();
  };

  const cardActions: MessageCardAction[] = [
    { name: 'more', label: 'More options', onPress: openMore },
    ...(isPinLocked
      ? []
      : [
          { name: 'togglePin', label: pinLabel, onPress: () => onTogglePin(conversation) },
          { name: 'toggleArchive', label: archiveLabel, onPress: () => onToggleArchive(conversation) },
        ]),
  ];

  const renderRightActions = (
    _progress: unknown,
    _translation: unknown,
    swipeable: SwipeableMethods
  ) => {
    // Close the row first so it doesn't stay open after the action.
    const run = (action: () => void) => () => {
      swipeable.close();
      action();
    };

    return (
      <View className='flex-row items-center pr-2'>
        <SwipeAction label='More' icon={IconDots} color={colors.actionMore} onPress={run(openMore)} />
        <SwipeAction
          label={pinLabel}
          icon={isPinned ? IconPinnedOff : IconPin}
          color={colors.actionPin}
          onPress={run(() => onTogglePin(conversation))}
          isDisabled={isPinLocked}
        />
        <SwipeAction
          label={archiveLabel}
          icon={isArchived ? IconArchiveOff : IconArchive}
          color={colors.actionArchive}
          onPress={run(() => onToggleArchive(conversation))}
          isDisabled={isPinLocked}
        />
      </View>
    );
  };

  return (
    <View className='-mx-5'>
      <ReanimatedSwipeable
        friction={2}
        rightThreshold={40}
        overshootRight={false}
        renderRightActions={renderRightActions}
      >
        <MessageCard
          name={conversation.other_user_name}
          apartmentName={conversation.apartment_name ?? 'Unknown Property'}
          lastMessage={conversation.last_message}
          messageType={conversation.last_message_type}
          isUserLastSender={Boolean(conversation.last_sender_is_me)}
          timestamp={getRelativeTime(new Date(conversation.last_message_time))}
          unreadCount={conversation.unread_count}
          isMarkedUnread={conversation.marked_unread}
          isPinned={isPinned}
          isMuted={conversation.is_muted}
          profilePictureUrl={conversation.other_user_avatar ?? undefined}
          onPress={() => onOpen(conversation)}
          onLongPress={handleLongPress}
          actions={cardActions}
        />
      </ReanimatedSwipeable>
    </View>
  );
}
