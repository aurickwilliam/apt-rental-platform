import {
  View,
  Text,
  FlatList,
  RefreshControl,
} from 'react-native';

import { Button, Spinner } from 'heroui-native';
import { SearchGridSkeleton } from './SearchSection';

import ApartmentCard, { type ApartmentCardProps } from 'components/cards/ApartmentCard';
import EmptyState from 'components/display/EmptyState';

import { IconSearchOff, IconAlertCircle } from '@tabler/icons-react-native';

import { useColors } from 'hooks/useTheme';
import {
  FLOATING_TAB_BAR_HEIGHT,
  FLOATING_TAB_BAR_BOTTOM_OFFSET
} from '@/app/(tabs)/components/CustomTabBar';

type ApartmentsListProps = {
  apartments: ApartmentCardProps[];
  isGridView: boolean;
  isFavorite: (id: string) => boolean;
  onPressApartment: (id: string) => void;
  onToggleFavorite: (id: string) => void | Promise<void>;
  loading: boolean;
  refreshing: boolean;
  loadingMore: boolean;
  error: string | null;
  onRefresh: () => void;
  onLoadMore: () => void;
  committedSearch?: string;
  selectedCity?: string;
  activeFilterCount?: number;
  onClearAll?: () => void;
};

export default function ApartmentsList({
  apartments,
  isGridView,
  isFavorite,
  onPressApartment,
  onToggleFavorite,
  loading,
  refreshing,
  loadingMore,
  error,
  onRefresh,
  onLoadMore,
  committedSearch = "",
  selectedCity = "CAMANAVA",
  activeFilterCount = 0,
  onClearAll,
}: ApartmentsListProps) {
  const { colors } = useColors();

  const renderApartmentCard = ({ item }: { item: ApartmentCardProps }) => (
    <ApartmentCard
      {...item}
      isFavorite={isFavorite(item.id)}
      isGrid={isGridView}
      onPress={() => onPressApartment(item.id)}
      onPressFavorite={() => {
        void onToggleFavorite(item.id);
      }}
    />
  );

  const renderEmptyState = () => {
    if (error) {
      return (
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
      );
    }

    const hasActiveFilters = activeFilterCount > 0;
    const hasSearch = committedSearch.trim() !== "";
    const hasCityFilter = selectedCity !== "CAMANAVA";
    const isFiltered = hasActiveFilters || hasSearch || hasCityFilter;

    if (isFiltered) {
      let description = "Try adjusting your search or filters.";
      if (hasSearch) description = `No matches for "${committedSearch.trim()}" — try a different search.`;
      else if (hasCityFilter && !hasActiveFilters) description = `Nothing in ${selectedCity} yet.`;
      else if (hasActiveFilters) description = "Try adjusting your filters.";

      return (
        <EmptyState
          variant="tenant"
          icon={<IconSearchOff size={64} color={colors.primary} />}
          title="No results found"
          description={description}
          action={
            onClearAll ? (
              <Button onPress={onClearAll} size="sm">
                <Button.Label>Clear All</Button.Label>
              </Button>
            ) : undefined
          }
        />
      );
    }

    return (
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
    );
  };

  const renderFooter = () => {
    if (!loadingMore) return null;
    return (
      <View className='py-4 items-center flex-row justify-center gap-2'>
        <Spinner size='sm' color={colors.primary} />
        <Text className='text-sm font-inter text-muted'>Loading more...</Text>
      </View>
    );
  };

  if (loading && !refreshing) {
    return (
      <View className="flex-1">
        <SearchGridSkeleton count={6} />
      </View>
    );
  }

  return (
    <FlatList
      key={isGridView ? 'grid' : 'list'}
      style={{ flex: 1 }}
      data={apartments}
      renderItem={renderApartmentCard}
      keyExtractor={(item) => item.id.toString()}
      numColumns={isGridView ? 2 : 1}
      columnWrapperStyle={isGridView ? { paddingHorizontal: 16, gap: 8 } : undefined}
      contentContainerStyle={{
        paddingBottom: FLOATING_TAB_BAR_HEIGHT + FLOATING_TAB_BAR_BOTTOM_OFFSET + 24,
        gap: 16,
        flexGrow: apartments.length === 0 ? 1 : 0,
      }}
      keyboardShouldPersistTaps="handled"
      ListEmptyComponent={renderEmptyState}
      ListFooterComponent={renderFooter}
      ListHeaderComponent={
        refreshing ? (
          <View className="items-center py-4 justify-center">
            <Spinner size='lg' color={colors.primary} />
          </View>
        ) : null
      }
      onEndReached={onLoadMore}
      onEndReachedThreshold={0.4}
      refreshControl={
        <RefreshControl
          // Keep the native indicator permanently hidden so only the
          // HeroUI Spinner (rendered in ListHeaderComponent) is shown.
          refreshing={false}
          onRefresh={onRefresh}
          colors={['transparent']}
          tintColor="transparent"
          progressBackgroundColor="transparent"
        />
      }
    />
  );
}
