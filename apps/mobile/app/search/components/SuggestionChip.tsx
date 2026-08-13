import { ScrollView, View } from 'react-native';

import { Chip } from 'heroui-native';

interface SuggestionChipProps {
  label: string;
  onPress: () => void;
}

function SuggestionChip({ label, onPress }: SuggestionChipProps) {
  return (
    <Chip
      variant="soft"
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

export function SuggestionChipScroll({ suggestions, onSelect }: SuggestionChipRowProps) {
  if (suggestions.length === 0) return null;

  return (
    <View style={{ paddingVertical: 8 }}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}
      >
        {suggestions.map((suggestion) => (
          <SuggestionChip
            key={suggestion}
            label={suggestion}
            onPress={() => onSelect(suggestion)}
          />
        ))}
      </ScrollView>
    </View>
  );
}

export function SuggestionChipFlex({ suggestions, onSelect }: SuggestionChipRowProps) {
  if (suggestions.length === 0) return null;

  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingVertical: 4 }}>
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

export default SuggestionChipScroll;
