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

export default function Search() {
  const router = useRouter();
  const { toast } = useToast();
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
    debouncedSearch,
    selectedCity,
    setIsGridView,
    setSearchQuery,
    setSelectedCity,
  } = useSearchLogic();

  const {
    sections,
    isLoading: sectionsLoading,
    isFetching: sectionsFetching,
    error: sectionsError,
    refetch: refetchSections,
    onViewableItemsChanged,
  } = useSearchSections({
    selectedCity,
    debouncedSearch,
    enabled: true,
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

  const isDefaultBrowse = searchQuery.trim() === "" && activeFilterCount === 0 && selectedCity === "CAMANAVA";
  const showNetflix = isDefaultBrowse;

  const handleRefresh = () => {
    if (showNetflix) {
      void refetchSections();
    } else {
      void fetchApartments(true);
    }
  };

  const isInitialLoading = showNetflix ? sectionsLoading : loading;

  return (
    <ScreenWrapper noBottomPadding>
      <SearchHeader
        cities={cities}
        selectedCity={selectedCity}
        onSelectCity={setSelectedCity}
        isGridView={isGridView}
        onToggleView={() => setIsGridView((previous) => !previous)}
        onFavoritesPress={() => router.push("/tenant/favorites")}
      />

      <SearchFiltersBar
        searchValue={searchQuery}
        onChangeSearch={setSearchQuery}
        onFilterPress={openFilterSheet}
        activeFilterCount={activeFilterCount}
        resultCount={
          searchQuery.trim() !== "" || activeFilterCount > 0 || selectedCity !== "CAMANAVA"
            ? resultCount
            : undefined
        }
        loading={loading}
        onClearFilters={handleClearFilters}
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
