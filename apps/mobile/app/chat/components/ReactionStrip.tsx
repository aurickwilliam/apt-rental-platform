import { Text, type LayoutChangeEvent } from 'react-native';

import { Button, Surface } from 'heroui-native';

import { IconPlus } from '@tabler/icons-react-native';

import { useColors } from '@/hooks/useTheme';

import { QUICK_REACTIONS } from './reactionEmojis';

interface ReactionStripProps {
  myReaction?: string;
  onSelect?: (emoji: string) => void;
  onOpenFullPicker?: () => void;
  onLayout?: (e: LayoutChangeEvent) => void;
}

/**
 * Quick-reaction pill shown above a held message: a HeroUI `Surface` with
 * icon-only ghost `Button`s; the current reaction is tinted.
 */
export default function ReactionStrip({
  myReaction,
  onSelect,
  onOpenFullPicker,
  onLayout,
}: ReactionStripProps) {
  const { colors } = useColors();

  return (
    <Surface
      onLayout={onLayout}
      className="flex-row items-center gap-0.5 rounded-full border border-border px-1.5 py-1 shadow-lg"
    >
      {QUICK_REACTIONS.map((emoji) => {
        const isSelected = myReaction === emoji;
        return (
          <Button
            key={emoji}
            variant="ghost"
            isIconOnly
            onPress={() => onSelect?.(emoji)}
            accessibilityLabel={`React with ${emoji}`}
            accessibilityState={{ selected: isSelected }}
            className={`rounded-full ${isSelected ? 'bg-accent/15' : ''}`}
          >
            <Text className="text-2xl leading-8">{emoji}</Text>
          </Button>
        );
      })}
      <Button
        variant="ghost"
        isIconOnly
        onPress={onOpenFullPicker}
        accessibilityLabel="More reactions"
        className="rounded-full"
      >
        <IconPlus size={22} color={colors.textPrimary} />
      </Button>
    </Surface>
  );
}
