import { View, FlatList, Text } from "react-native";
import { useTabScreenScroll } from "@/components/layout/TabBarVisibilityContext";
import { Button } from "heroui-native";
import { IconAlertCircle, IconSearchOff } from "@tabler/icons-react-native";
import EmptyState from "components/display/EmptyState";
import {
  PullToRefreshControl,
  PullToRefreshIndicator,
} from "components/display/PullToRefresh";
import { FLOATING_TAB_BAR_HEIGHT, FLOATING_TAB_BAR_BOTTOM_OFFSET } from "@/components/layout/CustomTabBar";
import SearchSection, { SearchSectionSkeleton } from "./SearchSection";
import type { SearchSection as SearchSectionType } from "@/hooks/search/useSearchSections";

type Props = {
  sections: SearchSectionType[];
  isLoading: boolean;
  isFetching: boolean;
  error: string | null;
  onRefresh: () => void;
  isFavorite: (id: string) => boolean;
  onToggleFavorite: (id: string) => void | Promise<void>;
  onPressApartment: (id: string) => void;
  cityLabel?: string;
  /** Saved preferences are set but Recommended for You has nothing to show. */
  showRecommendationNotice?: boolean;
  onUpdatePreferences?: () => void;
};

export default function SearchSectionsList({
  sections,
  isLoading,
  isFetching,
  error,
  onRefresh,
  isFavorite,
  onToggleFavorite,
  onPressApartment,
  cityLabel = "CAMANAVA",
  showRecommendationNotice = false,
  onUpdatePreferences,
}: Props) {
  const { ref: listRef, onScroll: onTabBarScroll } = useTabScreenScroll<FlatList>();

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
          icon={IconAlertCircle}
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
          icon={IconSearchOff}
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
      ref={listRef}
      onScroll={onTabBarScroll}
      scrollEventThrottle={16}
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
      initialNumToRender={2}
      windowSize={5}
      maxToRenderPerBatch={2}
      removeClippedSubviews={false}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
      refreshControl={
        <PullToRefreshControl
          refreshing={isFetching && !isLoading}
          onRefresh={onRefresh}
        />
      }
      // Only while refreshing: even an empty header gets a wrapper view, and the
      // list's gap would then put 16pt of space above the first section.
      ListHeaderComponent={
        isFetching && !isLoading || showRecommendationNotice ? (
          <>
            {isFetching && !isLoading ? <PullToRefreshIndicator refreshing /> : null}
            {showRecommendationNotice ? (
              <View className="mx-5 rounded-xl border border-border bg-surface p-4">
                <Text className="text-foreground font-nunitoSemiBold text-base">No recommendations right now</Text>
                <Text className="mt-1 text-muted font-inter text-[13px]">
                  Nothing fits your saved city, budget, household size and smoking choices at the moment. Update your
                  preferences to widen the search.
                </Text>
                {onUpdatePreferences ? (
                  <Button className="mt-3 self-start" size="sm" variant="secondary" onPress={onUpdatePreferences}>
                    <Button.Label>Update preferences</Button.Label>
                  </Button>
                ) : null}
              </View>
            ) : null}
          </>
        ) : null
      }
    />
  );
}
