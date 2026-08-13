import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useCallback, useMemo, useState } from "react";
import { useRouter } from "expo-router";
import { useToast } from "heroui-native";

import { LayoutGrid, Rows3 } from "lucide-react-native";

import ScreenWrapper from "components/layout/ScreenWrapper";
import StandardHeader from "components/layout/StandardHeader";
import ApartmentCard, { type ApartmentCardProps } from "components/cards/ApartmentCard";

import { useFavoriteApartments, useFavorites } from "@/hooks/favorites";
import { useColors } from "@/hooks/useTheme";

export default function TenantFavorites() {
  const router = useRouter();
  const { colors } = useColors();
  const { toast } = useToast();
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const {
    favoriteApartmentIds,
    loading: loadingFavorites,
    error: favoritesError,
    toggleFavorite,
  } = useFavorites();
  const {
    favoriteApartments,
    loading: loadingApartments,
    refreshing: refreshingApartments,
    error: apartmentsError,
    refreshFavoriteApartments,
  } = useFavoriteApartments();

  const apartments = useMemo<ApartmentCardProps[]>(
    () =>
      favoriteApartments.map((apartment) => {
        const images = apartment.apartment_images ?? [];
        const cover = images.find((image) => image.is_cover);
        const earliest = [...images].sort(
          (firstImage, secondImage) =>
            new Date(firstImage.created_at ?? 0).getTime() -
            new Date(secondImage.created_at ?? 0).getTime(),
        )[0];
        const thumbnailUrl =
          (cover?.url_thumb || cover?.url) ??
          (earliest?.url_thumb || earliest?.url) ??
          undefined;

        return {
          id: apartment.id,
          thumbnail: thumbnailUrl ? { uri: thumbnailUrl } : undefined,
          name: apartment.name,
          location: `${apartment.barangay}, ${apartment.city}`,
          ratings: apartment.average_rating?.toFixed(1) ?? "0.0",
          isFavorite: favoriteApartmentIds.has(apartment.id),
          monthlyRent: apartment.monthly_rent ?? 0,
          noBedroom: apartment.no_bedrooms ?? 0,
          noBathroom: apartment.no_bathrooms ?? 0,
          areaSqm: apartment.area_sqm ?? 0,
          isGrid: viewMode === "grid",
        };
      }),
    [favoriteApartmentIds, favoriteApartments, viewMode],
  );

  const toggleViewMode = () => {
    setViewMode((currentViewMode) =>
      currentViewMode === "grid" ? "list" : "grid",
    );
  };

  const handleFavoriteToggle = useCallback(
    async (apartmentId: string) => {
      try {
        const { wasFavorite } = await toggleFavorite(apartmentId);
        toast.show({
          variant: wasFavorite ? "default" : "success",
          label: wasFavorite ? "Removed from favorites" : "Added to favorites",
        });
      } catch (error) {
        console.error("Error toggling favorite:", error);
        toast.show({
          variant: "danger",
          label: "Something went wrong",
        });
      }
    },
    [toast, toggleFavorite],
  );

  const isLoading = loadingFavorites || loadingApartments;
  const combinedError = favoritesError ?? apartmentsError;

  const ToggleFavoritesView = (
    <TouchableOpacity
      activeOpacity={0.7}
      className="p-1 -mr-1"
      onPress={toggleViewMode}
    >
      {viewMode === "grid" ? (
        <Rows3 size={24} color={colors.secondaryForeground} />
      ) : (
        <LayoutGrid size={24} color={colors.secondaryForeground} />
      )}
    </TouchableOpacity>
  );

  return (
    <ScreenWrapper
      className="pt-5"
      header={
        <StandardHeader
          title="Favorites Apartment"
          rightComponent={ToggleFavoritesView}
        />
      }
      noBottomPadding
    >
      {isLoading ? (
        <View className="flex-1 items-center justify-center py-10">
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          key={viewMode === "grid" ? "grid" : "list"}
          style={{ flex: 1 }}
          data={apartments}
          renderItem={({ item: apartment }) => (
            <ApartmentCard
              {...apartment}
              isGrid={viewMode === "grid"}
              onPress={() => router.push(`/apartment/${apartment.id}`)}
              onPressFavorite={() => {
                void handleFavoriteToggle(apartment.id);
              }}
            />
          )}
          keyExtractor={(item) => item.id}
          numColumns={viewMode === "grid" ? 2 : 1}
          columnWrapperStyle={
            viewMode === "grid" ? { paddingHorizontal: 16, gap: 8 } : undefined
          }
          contentContainerStyle={{ paddingBottom: 16, gap: 16 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshingApartments}
              onRefresh={() => {
                void refreshFavoriteApartments();
              }}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }
          ListEmptyComponent={
            <View className="flex-1 items-center justify-center py-10">
              <Text className="text-lg text-gray-500 font-interSemiBold">
                {combinedError ?? "No favorite apartments yet"}
              </Text>
            </View>
          }
        />
      )}
    </ScreenWrapper>
  );
}
