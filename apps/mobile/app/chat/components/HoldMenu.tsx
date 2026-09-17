import { Pressable, Text, View } from 'react-native';

import {
  IconArrowBackUp,
  IconCopy,
  IconTrash,
} from '@tabler/icons-react-native';

import { useColors } from '@/hooks/useTheme';

import ReactionStrip from './ReactionStrip';

export interface HoldMenuData {
  myReaction?: string;
  dateLabel: string;
  canReact: boolean;
  canCopy: boolean;
  canUnsend: boolean;
}

interface HoldMenuProps {
  data: HoldMenuData;
  onSelectReaction: (emoji: string) => void;
  onOpenFullPicker: () => void;
  onReply: () => void;
  onCopy: () => void;
  onUnsend: () => void;
}

/**
 * Contextual action card only: reactions + timestamp + actions.
 * Theme-token styled (light/dark adaptive). The selected message itself
 * is rendered separately above the backdrop, never inside this card.
 */
export default function HoldMenu({
  data,
  onSelectReaction,
  onOpenFullPicker,
  onReply,
  onCopy,
  onUnsend,
}: HoldMenuProps) {
  const { colors } = useColors();

  return (
    <View className="bg-surface border border-border rounded-[20px] px-2 py-2 min-w-50">
      {data.canReact && (
        <>
          <ReactionStrip
            bare
            myReaction={data.myReaction}
            onSelect={onSelectReaction}
            onOpenFullPicker={onOpenFullPicker}
          />
          <View className="mx-2 my-1 h-px bg-border opacity-75" />
        </>
      )}
      <Text className="text-center text-[13px] font-inter text-gray-500">
        {data.dateLabel || 'Just now'}
      </Text>
      <Pressable
        onPress={onReply}
        accessibilityRole="button"
        accessibilityLabel="Reply to message"
        className="flex-row items-center gap-3 px-3 py-2.5"
      >
        <IconArrowBackUp size={22} color={colors.textPrimary} />
        <Text className="text-base font-inter text-foreground">Reply</Text>
      </Pressable>
      <Pressable
        onPress={data.canCopy ? onCopy : undefined}
        disabled={!data.canCopy}
        accessibilityRole="button"
        accessibilityLabel="Copy message"
        className="flex-row items-center gap-3 px-3 py-2.5"
      >
        <IconCopy size={22} color={colors.textPrimary} />
        <Text className="text-base font-inter text-foreground">Copy</Text>
      </Pressable>
      {data.canUnsend ? (
        <Pressable
          onPress={onUnsend}
          accessibilityRole="button"
          accessibilityLabel="Unsend message"
          className="flex-row items-center gap-3 px-3 py-2.5"
        >
          <IconTrash size={22} color={colors.danger} />
          <Text className="text-base font-inter text-danger">Unsend</Text>
        </Pressable>
      ) : (
        <View
          accessibilityLabel="Unsend message"
          className="flex-row items-center gap-3 px-3 py-2.5 opacity-40"
        >
          <IconTrash size={22} color={colors.gray400} />
          <Text className="text-base font-inter text-gray-500">Unsend</Text>
        </View>
      )}
    </View>
  );
}
