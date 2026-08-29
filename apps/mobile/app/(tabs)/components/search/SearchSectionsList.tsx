import { View, FlatList, RefreshControl, Text } from "react-native";
import { Spinner } from "heroui-native";
import { useColors } from "hooks/useTheme";
import { FLOATING_TAB_BAR_HEIGHT, FLOATING_TAB_BAR_BOTTOM_OFFSET } from "@/app/(tabs)/components/CustomTabBar";
import SearchSection, { SearchSectionSkeleton } from "./SearchSection";
import type { SearchSection as SearchSectionType } from "./useSearchSections";

type Props = {
  sections: SearchSectionType[];
  isLoading: boolean;
  isFetching: boolean;
  error: string | null;
  onRefresh: () => void;
  onViewableItemsChanged: (info: { viewableItems: { item: SearchSectionType }[] }) => void;
  isFavorite: (id: string) => boolean;
  onToggleFavorite: (id: string) => void | Promise<void>;
  onPressApartment: (id: string) => void;
};

export default function SearchSectionsList({
  sections,
  isLoading,
  isFetching,
  error,
  onRefresh,
  onViewableItemsChanged,
  isFavorite,
  onToggleFavorite,
  onPressApartment,
}: Props) {
  const { colors } = useColors();

  if (isLoading) {
    return (
      <View className="flex-1 gap-6 py-4">
        {[0, 1, 2].map((i) => (
          <SearchSectionSkeleton key={i} />
        ))}
      </View>
    );
  }

  if (error) {
    return (
      <View className="flex-1 items-center justify-center py-10 px-5">
        <Text className="text-lg text-gray-500 font-nunitoSemiBold text-center">{error}</Text>
      </View>
    );
  }

  if (!sections.length || sections.every((s) => s.apartments.length === 0)) {
    return (
      <View className="flex-1 items-center justify-center py-10">
        <Text className="text-lg text-gray-500 font-nunitoSemiBold">No apartments found</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={sections}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <SearchSection
          section={item}
          isFavorite={isFavorite}
          onToggleFavorite={onToggleFavorite}
          onPressApartment={onPressApartment}
        />
      )}
      style={{ flex: 1 }}
      contentContainerStyle={{
        paddingBottom: FLOATING_TAB_BAR_HEIGHT + FLOATING_TAB_BAR_BOTTOM_OFFSET + 24,
        gap: 16,
        paddingTop: 8,
      }}
      onViewableItemsChanged={onViewableItemsChanged as any}
      viewabilityConfig={{ itemVisiblePercentThreshold: 30 }}
      initialNumToRender={2}
      windowSize={5}
      maxToRenderPerBatch={2}
      removeClippedSubviews={false}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      refreshControl={
        <RefreshControl
          refreshing={isFetching && !isLoading}
          onRefresh={onRefresh}
          colors={["transparent"]}
          tintColor="transparent"
          progressBackgroundColor="transparent"
        />
      }
      ListHeaderComponent={
        isFetching && !isLoading ? (
          <View className="items-center py-3">
            <Spinner size="lg" color={colors.primary} />
          </View>
        ) : null
      }
    />
  );
}
