import { View, Text } from 'react-native'

import { BottomSheet, PressableFeedback } from 'heroui-native'

import {
  IconArchive,
  IconArchiveOff,
  IconBan,
  IconBell,
  IconBellOff,
  IconBuilding,
  IconFlag,
  IconMail,
  IconMailOpened,
  IconPin,
  IconPinnedOff,
  IconUser,
  type Icon,
} from '@tabler/icons-react-native'

import { useColors } from '@/hooks/useTheme'
import { hasUnread } from '@/service/chat/conversationList'
import type { ConversationWithMeta } from '@/service/chat/conversationService'

export type ConversationMoreAction =
  | 'togglePin'
  | 'toggleArchive'
  | 'toggleRead'
  | 'viewProfile'
  | 'viewApartment'
  | 'toggleMute'
  | 'report'
  | 'toggleBlock';

interface ConversationMoreSheetProps {
  conversation: ConversationWithMeta | null;
  isOpen: boolean;
  /** Pinned by the app (current landlord): Pin and Archive are disabled. */
  isPinLocked?: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (action: ConversationMoreAction, conversation: ConversationWithMeta) => void;
}

interface SheetOption {
  action: ConversationMoreAction;
  label: string;
  icon: Icon;
  isDestructive?: boolean;
  isDisabled?: boolean;
  /** Shown under the label, e.g. why the option is unavailable. */
  note?: string;
}

// Matches the disabled swipe actions.
const DISABLED_OPTION_OPACITY = 0.4;

function getOptions(conversation: ConversationWithMeta, isPinLocked: boolean): SheetOption[] {
  const firstName = conversation.other_user_name.split(' ')[0] || 'this person';
  const isPinned = isPinLocked || conversation.is_pinned;
  const isArchived = conversation.is_archived && !isPinLocked;

  return [
    isPinned
      ? { action: 'togglePin', label: 'Unpin', icon: IconPinnedOff, isDisabled: isPinLocked }
      : { action: 'togglePin', label: 'Pin', icon: IconPin },
    isArchived
      ? { action: 'toggleArchive', label: 'Unarchive', icon: IconArchiveOff }
      : { action: 'toggleArchive', label: 'Archive', icon: IconArchive, isDisabled: isPinLocked },
    hasUnread(conversation)
      ? { action: 'toggleRead', label: 'Mark as read', icon: IconMailOpened }
      : { action: 'toggleRead', label: 'Mark as unread', icon: IconMail },
    { action: 'viewProfile', label: 'View profile', icon: IconUser },
    ...(conversation.apartment_id
      ? [{ action: 'viewApartment' as const, label: 'View apartment', icon: IconBuilding }]
      : []),
    conversation.is_muted
      ? { action: 'toggleMute', label: 'Unmute notifications', icon: IconBell }
      : { action: 'toggleMute', label: 'Mute notifications', icon: IconBellOff },
    { action: 'report', label: `Report ${firstName}`, icon: IconFlag, isDestructive: true },
    conversation.blocked_by_me
      ? { action: 'toggleBlock', label: `Unblock ${firstName}`, icon: IconBan }
      : conversation.in_active_tenancy
        ? {
            // The database refuses this too; the note says why.
            action: 'toggleBlock',
            label: `Block ${firstName}`,
            icon: IconBan,
            isDestructive: true,
            isDisabled: true,
            note: 'You can block after your tenancy ends. Report or mute instead.',
          }
        : { action: 'toggleBlock', label: `Block ${firstName}`, icon: IconBan, isDestructive: true },
  ];
}

/** Options for one conversation, opened by holding a row or its More swipe action. */
export default function ConversationMoreSheet({
  conversation,
  isOpen,
  isPinLocked = false,
  onOpenChange,
  onSelect,
}: ConversationMoreSheetProps) {
  const { colors } = useColors();

  return (
    <BottomSheet isOpen={isOpen && conversation !== null} onOpenChange={onOpenChange}>
      <BottomSheet.Portal>
        <BottomSheet.Overlay />
        <BottomSheet.Content>
          {conversation ? (
            <View className='pb-6'>
              {getOptions(conversation, isPinLocked).map(
                ({ action, label, icon: OptionIcon, isDestructive, isDisabled = false, note }) => {
                  // Dim only the icon and label so a note stays readable.
                  const dimmed = isDisabled ? { opacity: DISABLED_OPTION_OPACITY } : undefined;
                  return (
                    <PressableFeedback
                      key={action}
                      onPress={() => onSelect(action, conversation)}
                      isDisabled={isDisabled}
                      accessibilityRole='button'
                      accessibilityLabel={label}
                      accessibilityHint={note}
                      accessibilityState={{ disabled: isDisabled }}
                      className='flex-row items-center gap-4 min-h-14 px-2 py-2 rounded-2xl'
                    >
                      <PressableFeedback.Highlight />
                      <View style={dimmed}>
                        <OptionIcon size={22} color={isDestructive ? colors.danger : colors.textPrimary} />
                      </View>
                      <View className='flex-1'>
                        <Text
                          className={`text-base font-inter ${isDestructive ? 'text-danger' : 'text-foreground'}`}
                          style={dimmed}
                        >
                          {label}
                        </Text>
                        {note ? (
                          <Text className='mt-0.5 text-xs text-gray-500 font-inter'>{note}</Text>
                        ) : null}
                      </View>
                    </PressableFeedback>
                  );
                }
              )}
            </View>
          ) : null}
        </BottomSheet.Content>
      </BottomSheet.Portal>
    </BottomSheet>
  );
}
