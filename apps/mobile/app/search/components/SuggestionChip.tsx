import { ScrollView, Pressable, Text, View } from 'react-native';

import { useColors } from '@/hooks/useTheme';

interface SuggestionChipProps {
  label: string;
  onPress: () => void;
}

function SuggestionChip({ label, onPress }: SuggestionChipProps) {
  const { colors } = useColors();

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Send suggestion: ${label}`}
      style={{
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: colors.gray300,
        backgroundColor: colors.surface,
        marginRight: 8,
        marginBottom: 6,
      }}
    >
      <Text style={{ fontSize: 13, color: colors.textPrimary, fontFamily: 'Inter_500Medium' }}>
        {label}
      </Text>
    </Pressable>
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
        contentContainerStyle={{ paddingHorizontal: 16 }}
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
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', paddingVertical: 4 }}>
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
