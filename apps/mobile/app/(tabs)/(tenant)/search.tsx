import { Keyboard } from "react-native";

import { useRouter } from "expo-router";

import ScreenWrapper from "components/layout/ScreenWrapper";
import FilterBottomSheet, {
  DEFAULT_FILTERS,
} from "@/app/(tabs)/components/search/FilterBottomSheet";
import ApartmentsList from "../components/search/ApartmentsList";
import SearchFiltersBar from "../components/search/SearchFiltersBar";
import SearchHeader from "../components/search/SearchHeader";
import SearchSectionsList from "../components/search/SearchSectionsList";
import useSearchLogic from "../components/search/useSearchLogic";
import { useSearchSections } from "../components/search/useSearchSections";
import { useUserPreferences } from "@/hooks/preferences/useUserPreferences";
import { useFavoriteToggle } from "@/hooks/favorites";

export default function Search() {
  const router = useRouter();
  const { preferences, hasPrefs, isLoading: prefsLoading } = useUserPreferences();
  const { toggleFavoriteWithToast } = useFavoriteToggle();

  const initialCity = "CAMANAVA";

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
    isFavorite,
    isGridView,
    loading,
    loadingMore,
    loadMore,
    openFilterSheet,
    refreshing,
    resultCount,
    searchDraft,
    committedSearch,
    commitSearch,
    clearSearch,
    selectedCity,
    setIsGridView,
    setSearchDraft,
    setSelectedCity,
  } = useSearchLogic({ initialCity });

  const isDefaultBrowse =
    committedSearch.trim() === "" && activeFilterCount === 0 && selectedCity === initialCity;
  const showNetflix = isDefaultBrowse;

  const preferencesForSections = isDefaultBrowse && hasPrefs ? preferences : null;
  const isGateLoading = prefsLoading && !preferences && isDefaultBrowse;

  const {
    sections,
    isLoading: sectionsLoading,
    isFetching: sectionsFetching,
    error: sectionsError,
    refetch: refetchSections,
    onViewableItemsChanged,
  } = useSearchSections({
    selectedCity,
    committedSearch,
    enabled: true,
    preferences: preferencesForSections,
  });

  const handleApartmentPress = (id: string) => router.push(`/apartment/${id}` as any);

  const handleFavoritePress = async (apartmentId: string) => {
    await toggleFavoriteWithToast(apartmentId);
  };

  const handleMapPress = () => {
    router.push("/tenant/map-search" as any);
  };

  const handleClearAll = () => {
    clearSearch();
    handleClearFilters();
    if (selectedCity !== initialCity) setSelectedCity(initialCity);
  };

  const handleSubmitSearch = () => {
    Keyboard.dismiss();
    commitSearch(searchDraft);
  };

  const handleRefresh = () => {
    if (showNetflix) {
      void refetchSections();
    } else {
      void fetchApartments(true);
    }
  };

  const isInitialLoading = isGateLoading || (showNetflix ? sectionsLoading : loading);

  return (
    <ScreenWrapper noBottomPadding>
      <SearchHeader
        cities={cities}
        selectedCity={selectedCity}
        onSelectCity={setSelectedCity}
        isGridView={isGridView}
        onToggleView={() => setIsGridView((previous) => !previous)}
        onFavoritesPress={() => router.push("/tenant/favorites")}
        isNetflixMode={showNetflix}
        onMapPress={handleMapPress}
      />

      <SearchFiltersBar
        searchValue={searchDraft}
        onChangeSearch={setSearchDraft}
        onSubmitSearch={handleSubmitSearch}
        onClearSearch={clearSearch}
        onFilterPress={openFilterSheet}
        activeFilterCount={activeFilterCount}
        resultCount={
          committedSearch.trim() !== "" || activeFilterCount > 0 || selectedCity !== initialCity
            ? resultCount
            : undefined
        }
        loading={loading || isGateLoading}
        onClearFilters={handleClearFilters}
        selectedCity={selectedCity}
        committedSearch={committedSearch}
      />

      {showNetflix ? (
        <SearchSectionsList
          sections={sections}
          isLoading={isInitialLoading}
          isFetching={sectionsFetching}
          error={sectionsError}
          onRefresh={handleRefresh}
          onViewableItemsChanged={onViewableItemsChanged}
          isFavorite={isFavorite}
          onToggleFavorite={handleFavoritePress}
          onPressApartment={handleApartmentPress}
          cityLabel={selectedCity}
        />
      ) : (
        <ApartmentsList
          apartments={apartments}
          isGridView={isGridView}
          isFavorite={isFavorite}
          onPressApartment={handleApartmentPress}
          onToggleFavorite={handleFavoritePress}
          loading={loading}
          refreshing={refreshing}
          loadingMore={loadingMore}
          error={error}
          onRefresh={() => fetchApartments(true)}
          onLoadMore={loadMore}
          committedSearch={committedSearch}
          selectedCity={selectedCity}
          activeFilterCount={activeFilterCount}
          onClearAll={handleClearAll}
        />
      )}

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
