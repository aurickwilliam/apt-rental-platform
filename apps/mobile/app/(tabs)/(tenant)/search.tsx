import { useRouter } from 'expo-router';

import ScreenWrapper from 'components/layout/ScreenWrapper';
import FilterBottomSheet, {
  DEFAULT_FILTERS,
} from '@/app/(tabs)/components/search/FilterBottomSheet';
import ApartmentsList from '../components/search/ApartmentsList';
import SearchFiltersBar from '../components/search/SearchFiltersBar';
import SearchHeader from '../components/search/SearchHeader';
import useSearchLogic from '../components/search/useSearchLogic';

export default function Search() {
  const router = useRouter();

  const {
    apartments,
    activeFilterCount,
    cities,
    error,
    fetchApartments,
    filters,
    isFilterSheetOpen,
    setIsFilterSheetOpen,
    handleApplyFilters,
    handleClearFilters,
    handleToggleFavorite,
    isFavorite,
    isGridView,
    loading,
    loadingMore,
    loadMore,
    openFilterSheet,
    refreshing,
    resultCount,
    searchQuery,
    selectedCity,
    setIsGridView,
    setSearchQuery,
    setSelectedCity,
  } = useSearchLogic();

  const handleApartmentPress = (id: string) => router.push(`/apartment/${id}`);

  return (
    <ScreenWrapper noBottomPadding>
      <SearchHeader
        cities={cities}
        selectedCity={selectedCity}
        onSelectCity={setSelectedCity}
        isGridView={isGridView}
        onToggleView={() => setIsGridView((prev) => !prev)}
        onFavoritesPress={() => router.push('/tenant/favorites')}
      />

      <SearchFiltersBar
        searchValue={searchQuery}
        onChangeSearch={setSearchQuery}
        onFilterPress={openFilterSheet}
        activeFilterCount={activeFilterCount}
        resultCount={resultCount}
        loading={loading}
        onClearFilters={handleClearFilters}
      />

      <ApartmentsList
        apartments={apartments}
        isGridView={isGridView}
        isFavorite={isFavorite}
        onPressApartment={handleApartmentPress}
        onToggleFavorite={handleToggleFavorite}
        loading={loading}
        refreshing={refreshing}
        loadingMore={loadingMore}
        error={error}
        onRefresh={() => fetchApartments(true)}
        onLoadMore={loadMore}
      />

      {/* ── Filter Bottom Sheet ── */}
      <FilterBottomSheet
        isOpen={isFilterSheetOpen}
        onOpenChange={setIsFilterSheetOpen}
        resultCount={resultCount}
        initialFilters={filters ?? DEFAULT_FILTERS}
        onApply={handleApplyFilters}
        onClear={handleClearFilters}
      />
    </ScreenWrapper>
  );
}
