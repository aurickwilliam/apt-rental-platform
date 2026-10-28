import { View } from 'react-native';

import { Chip } from 'heroui-native';

interface SuggestionChipProps {
  label: string;
  onPress: () => void;
}

function SuggestionChip({ label, onPress }: SuggestionChipProps) {
  return (
    <Chip
      variant="secondary"
      color="default"
      onPress={onPress}
      accessibilityLabel={`Send suggestion: ${label}`}
    >
      <Chip.Label>{label}</Chip.Label>
    </Chip>
  );
}

interface SuggestionChipRowProps {
  suggestions: string[];
  onSelect: (text: string) => void;
}

/** Quick replies under one of Ava's answers. */
export function SuggestionChipFlex({ suggestions, onSelect }: SuggestionChipRowProps) {
  if (suggestions.length === 0) return null;

  return (
    <View className="flex-row flex-wrap gap-2">
      {suggestions.map((suggestion) => (
        <SuggestionChip
          key={suggestion}
          label={suggestion}
          onPress={() => onSelect(suggestion)}
        />
      ))}
    </View>
  );
}

export default SuggestionChipFlex;
