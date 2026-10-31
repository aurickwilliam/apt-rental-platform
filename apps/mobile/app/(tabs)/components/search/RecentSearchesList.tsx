import { View, Text, Pressable, ScrollView } from "react-native";

import { Image } from "expo-image";
import { IconPhoto } from "@tabler/icons-react-native";

import { useColors } from "hooks/useTheme";
import type { RecentApartmentSearch } from "@/service/search/recentApartmentSearches";

type RecentSearchesListProps = {
  /** Where the card starts: the bottom edge of the search field. */
  top: number;
  recent: RecentApartmentSearch[];
  onSelect: (apartment: RecentApartmentSearch) => void;
  onClear: () => void;
};

export default function RecentSearchesList({
  top,
  recent,
  onSelect,
  onClear,
}: RecentSearchesListProps) {
  const { colors } = useColors();

  return (
    <View
      className="absolute inset-x-5 z-50 overflow-hidden rounded-2xl border border-border bg-surface"
      style={{ top: top + 4, elevation: 8 }}
    >
    <ScrollView
      className="max-h-96"
      keyboardShouldPersistTaps="handled"
      contentContainerClassName="px-4 pb-2"
    >
      <View className="flex-row items-center justify-between pb-2 pt-3">
        <Text className="text-sm font-nunitoSemiBold text-muted">Recent Searches</Text>
        <Pressable
          onPress={onClear}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Clear recent searches"
        >
          <Text className="text-sm font-nunitoSemiBold text-primary">Clear</Text>
        </Pressable>
      </View>

      {recent.map((item) => (
        <Pressable
          key={item.id}
          onPress={() => onSelect(item)}
          accessibilityRole="button"
          accessibilityLabel={`${item.name}, ${item.location}`}
          className="flex-row items-center gap-3 py-2"
        >
          <View className="h-14 w-14 overflow-hidden rounded-xl bg-gray-200 items-center justify-center">
            {item.thumbnailUri ? (
              <Image
                source={{ uri: item.thumbnailUri }}
                style={{ height: "100%", width: "100%" }}
                contentFit="cover"
                cachePolicy="disk"
              />
            ) : (
              <IconPhoto size={24} color={colors.gray400} />
            )}
          </View>
          <View className="flex-1">
            <Text numberOfLines={1} className="text-base font-nunitoSemiBold text-foreground">
              {item.name}
            </Text>
            <Text numberOfLines={1} className="text-sm font-inter text-muted">
              {item.location}
            </Text>
          </View>
        </Pressable>
      ))}
    </ScrollView>
    </View>
  );
}
