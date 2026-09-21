import { View, FlatList, RefreshControl } from "react-native";
import { Button, Spinner } from "heroui-native";
import { IconAlertCircle, IconSearchOff } from "@tabler/icons-react-native";
import EmptyState from "components/display/EmptyState";
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
  cityLabel?: string;
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
  cityLabel = "CAMANAVA",
}: Props) {
  const { colors } = useColors();

  if (isLoading) {
    return (
      <View className="flex-1 py-4 gap-6">
        {[0, 1, 2].map((i) => (
          <SearchSectionSkeleton key={i} />
        ))}
      </View>
    );
  }

  if (error) {
    return (
      <View className="flex-1 px-5">
        <EmptyState
          variant="tenant"
          icon={<IconAlertCircle size={64} color={colors.primary} />}
          title="Something went wrong"
          description={error}
          action={
            <Button onPress={onRefresh} size="sm">
              <Button.Label>Try Again</Button.Label>
            </Button>
          }
        />
      </View>
    );
  }

  if (!sections.length || sections.every((s) => s.apartments.length === 0)) {
    return (
      <View className="flex-1 px-5">
        <EmptyState
          variant="tenant"
          icon={<IconSearchOff size={64} color={colors.primary} />}
          title="No apartments available"
          description="We couldn't find any listings. Pull to refresh or try another city."
          action={
            <Button onPress={onRefresh} size="sm">
              <Button.Label>Try Again</Button.Label>
            </Button>
          }
        />
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
          // Native indicator is fully suppressed — the HeroUI Spinner in
          // ListHeaderComponent below is the only visible loading indicator.
          refreshing={false}
          onRefresh={onRefresh}
          colors={['transparent']}
          tintColor="transparent"
          progressBackgroundColor="transparent"
        />
      }
      ListHeaderComponent={
        isFetching && !isLoading ? (
          <View className="items-center py-4 justify-center">
            <Spinner size="lg" color={colors.primary} accessibilityLabel="Refreshing" />
          </View>
        ) : null
      }
    />
  );
}
