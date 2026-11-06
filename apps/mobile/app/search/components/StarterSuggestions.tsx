import { ScrollView } from 'react-native';

import { Chip } from 'heroui-native';

export interface StarterSuggestion {
  /** One short line shown on the chip. */
  label: string;
  /** What is sent when the chip is tapped. */
  message: string;
}

interface StarterSuggestionsProps {
  suggestions: readonly StarterSuggestion[];
  onSelect: (message: string) => void;
}

/** Conversation starters shown as one row of chips above the composer before the first message. */
export default function StarterSuggestions({ suggestions, onSelect }: StarterSuggestionsProps) {
  if (suggestions.length === 0) return null;

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      // A horizontal ScrollView grows to fill its parent's height otherwise.
      style={{ flexGrow: 0 }}
      contentContainerClassName="gap-2 px-4 pb-2 items-center"
      keyboardShouldPersistTaps="handled"
    >
      {suggestions.map((suggestion) => (
        <Chip
          key={suggestion.message}
          variant="secondary"
          color="default"
          onPress={() => onSelect(suggestion.message)}
          accessibilityLabel={`Send suggestion: ${suggestion.message}`}
        >
          <Chip.Label numberOfLines={1}>{suggestion.label}</Chip.Label>
        </Chip>
      ))}
    </ScrollView>
  );
}
