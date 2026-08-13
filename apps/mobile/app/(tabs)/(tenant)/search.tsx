import { useRouter } from "expo-router";
import { useToast } from "heroui-native";

import ScreenWrapper from "components/layout/ScreenWrapper";
import FilterBottomSheet, {
  DEFAULT_FILTERS,
} from "@/app/(tabs)/components/search/FilterBottomSheet";
import ApartmentsList from "../components/search/ApartmentsList";
import SearchFiltersBar from "../components/search/SearchFiltersBar";
import SearchHeader from "../components/search/SearchHeader";
import useSearchLogic from "../components/search/useSearchLogic";

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
    selectedCity,
    setIsGridView,
    setSearchQuery,
    setSelectedCity,
  } = useSearchLogic();

  const handleApartmentPress = (id: string) => router.push(`/apartment/${id}`);

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
        resultCount={resultCount}
        loading={loading}
        onClearFilters={handleClearFilters}
      />

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
