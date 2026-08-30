import { Keyboard } from "react-native";

import { useRouter } from "expo-router";
import { useToast } from "heroui-native";

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

export default function Search() {
  const router = useRouter();
  const { toast } = useToast();
  const { preferences, hasPrefs, isLoading: prefsLoading } = useUserPreferences();

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
    handleToggleFavorite,
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
    try {
      const { wasFavorite } = await handleToggleFavorite(apartmentId);
      toast.show({
        variant: wasFavorite ? "default" : "success",
        label: wasFavorite ? "Removed from favorites" : "Added to favorites",
      });
    } catch (toggleError) {
      console.error("Error toggling favorite:", toggleError);
      toast.show({ variant: "danger", label: "Something went wrong" });
    }
  };

  const handleMapPress = () => {
    toast.show({ variant: "default", label: "Map search coming soon" });
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
