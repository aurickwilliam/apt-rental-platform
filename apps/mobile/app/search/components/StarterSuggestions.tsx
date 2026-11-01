import { ScrollView, Text } from 'react-native';

import { PressableFeedback } from 'heroui-native';

export interface StarterSuggestion {
  title: string;
  detail: string;
  /** What is sent when the card is tapped. */
  message: string;
}

interface StarterSuggestionsProps {
  suggestions: readonly StarterSuggestion[];
  onSelect: (message: string) => void;
}

/** Conversation starters shown above the composer before the first message. */
export default function StarterSuggestions({ suggestions, onSelect }: StarterSuggestionsProps) {
  if (suggestions.length === 0) return null;

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      // A horizontal ScrollView grows to fill its parent's height otherwise.
      style={{ flexGrow: 0 }}
      contentContainerClassName="gap-2 px-4 pb-2 items-start"
      keyboardShouldPersistTaps="handled"
    >
      {suggestions.map((suggestion) => (
        <PressableFeedback
          key={suggestion.message}
          onPress={() => onSelect(suggestion.message)}
          className="rounded-2xl border border-border bg-surface px-4 py-3"
          accessibilityRole="button"
          accessibilityLabel={`Send suggestion: ${suggestion.message}`}
        >
          <Text className="text-sm font-nunitoSemiBold text-foreground">{suggestion.title}</Text>
          <Text className="text-xs font-inter text-muted mt-0.5">{suggestion.detail}</Text>
        </PressableFeedback>
      ))}
    </ScrollView>
  );
}
