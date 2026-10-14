import { View, Text } from 'react-native'

import { PressableFeedback, Separator } from 'heroui-native'

import { IconArchive, IconChevronRight } from '@tabler/icons-react-native'

import { useColors } from '@/hooks/useTheme'
import type { ConversationListItem } from '@/service/chat/conversationList'
import type { ConversationWithMeta } from '@/service/chat/conversationService'

import ConversationRow from './ConversationRow'
import MessageCard from './MessageCard'

type LandlordShortcutItem = Extract<ConversationListItem, { kind: 'landlord-shortcut' }>;

export interface ConversationRowHandlers {
  openMore: (conversation: ConversationWithMeta) => void;
  togglePin: (conversation: ConversationWithMeta) => void;
  toggleArchive: (conversation: ConversationWithMeta) => void;
}

interface ConversationListRowProps {
  item: ConversationListItem;
  onOpen: (conversation: ConversationWithMeta) => void;
  handlers: ConversationRowHandlers;
  onOpenArchived?: () => void;
  onStartLandlordChat?: (shortcut: LandlordShortcutItem) => void;
}

/** Renders one Messages list row of any kind. */
export default function ConversationListRow({
  item,
  onOpen,
  handlers,
  onOpenArchived,
  onStartLandlordChat,
}: ConversationListRowProps) {
  const { colors } = useColors();

  switch (item.kind) {
    case 'conversation':
      return (
        <ConversationRow
          conversation={item.conversation}
          onOpen={onOpen}
          onMore={handlers.openMore}
          onTogglePin={handlers.togglePin}
          onToggleArchive={handlers.toggleArchive}
          isPinLocked={item.isPinLocked}
        />
      );

    case 'landlord-shortcut':
      return (
        <View className='-mx-5'>
          <MessageCard
            name={item.landlordName}
            apartmentName={item.apartmentName}
            lastMessage='Send your landlord a message'
            timestamp=''
            isPinned
            profilePictureUrl={item.landlordAvatar ?? undefined}
            onPress={() => onStartLandlordChat?.(item)}
          />
        </View>
      );

    case 'separator':
      return <Separator className='my-2' />;

    case 'archived':
      return (
        <PressableFeedback
          onPress={onOpenArchived}
          accessibilityRole='button'
          accessibilityLabel={`Archived chats, ${item.count}`}
          className='-mx-5 flex-row items-center gap-3 px-5 py-4 rounded-3xl'
        >
          <PressableFeedback.Highlight />
          <View className='size-12 items-center justify-center rounded-full bg-surface'>
            <IconArchive size={22} color={colors.gray500} />
          </View>
          <Text className='flex-1 text-sm text-foreground font-nunitoSemiBold'>
            Archived chats ({item.count})
          </Text>
          <IconChevronRight size={18} color={colors.gray500} />
        </PressableFeedback>
      );
  }
}
