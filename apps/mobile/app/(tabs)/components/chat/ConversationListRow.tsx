import { View } from 'react-native'

import { Separator } from 'heroui-native'

import type { ConversationListItem } from '@/service/chat/conversationList'
import type { ConversationWithMeta } from '@/service/chat/conversationService'

import ConversationRow from './ConversationRow'
import MessageCard from './MessageCard'

type LandlordShortcutItem = Extract<ConversationListItem, { kind: 'landlord-shortcut' }>;

export interface ConversationRowHandlers {
  openMore: (conversation: ConversationWithMeta, options: { isPinLocked: boolean }) => void;
  togglePin: (conversation: ConversationWithMeta) => void;
  toggleArchive: (conversation: ConversationWithMeta) => void;
}

interface ConversationListRowProps {
  item: ConversationListItem;
  onOpen: (conversation: ConversationWithMeta) => void;
  handlers: ConversationRowHandlers;
  onStartLandlordChat?: (shortcut: LandlordShortcutItem) => void;
}

/** Renders one Messages list row of any kind. */
export default function ConversationListRow({
  item,
  onOpen,
  handlers,
  onStartLandlordChat,
}: ConversationListRowProps) {
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
  }
}
