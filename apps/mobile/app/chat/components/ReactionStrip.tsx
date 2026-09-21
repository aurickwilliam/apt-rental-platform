import { Pressable, Text, View, type LayoutChangeEvent } from 'react-native';

import { IconPlus } from '@tabler/icons-react-native';

import { useColors } from '@/hooks/useTheme';

import { QUICK_REACTIONS } from './reactionEmojis';

interface ReactionStripProps {
  myReaction?: string;
  onSelect?: (emoji: string) => void;
  onOpenFullPicker?: () => void;
  onLayout?: (e: LayoutChangeEvent) => void;
  /**
   * Inline row inside the anchored Menu card (single menu, no separate pill):
   * drops the floating surface/border/shadow and shrinks targets so 6 emojis
   * + the picker button fit the 220-wide card in one row.
   */
  bare?: boolean;
}

/**
 * Quick-reaction row. Default is the floating pill; `bare` renders the same
 * row inline inside the hold Menu card.
 */
export default function ReactionStrip({
  myReaction,
  onSelect,
  onOpenFullPicker,
  onLayout,
  bare = false,
}: ReactionStripProps) {
  const { colors } = useColors();

  return (
    <View
      onLayout={onLayout}
      className={
        bare
          ? 'flex-row items-center justify-between'
          : 'flex-row items-center bg-surface border border-border rounded-full px-3 py-2 shadow-lg'
      }
    >
      {QUICK_REACTIONS.map((emoji) => (
        <Pressable
          key={emoji}
          onPress={() => onSelect?.(emoji)}
          accessibilityRole="button"
          accessibilityLabel={`React with ${emoji}`}
          className={`rounded-full ${bare ? 'p-1' : 'p-2.5'} ${myReaction === emoji ? 'bg-accent/15' : ''}`}
        >
          <Text className={bare ? 'text-base leading-6' : 'text-2xl leading-8'}>{emoji}</Text>
        </Pressable>
      ))}
      <Pressable
        onPress={onOpenFullPicker}
        accessibilityRole="button"
        accessibilityLabel="More reactions"
        className={`rounded-full ${bare ? 'p-1' : 'p-2.5'}`}
      >
        <IconPlus size={bare ? 16 : 22} color={colors.textPrimary} />
      </Pressable>
    </View>
  );
}
