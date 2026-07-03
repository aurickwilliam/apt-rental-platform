import { View, Text } from 'react-native';
import { SearchX } from 'lucide-react-native';
import { useColors } from '@/hooks/useTheme';

export default function EmptySearchResults({ query }: { query: string }) {
  const { colors } = useColors();

  return (
    <View className="flex-1 items-center justify-center gap-3 py-16">
      <SearchX size={40} color={colors.textSecondary} />
      <View className="items-center gap-1">
        <Text className="text-base font-interSemiBold text-foreground">
          No results found
        </Text>
        {query.trim() && (
          <Text className="text-sm font-inter text-muted text-center px-8">
            No applications match `&quot;{query}&quot;
          </Text>
        )}
      </View>
    </View>
  );
}
