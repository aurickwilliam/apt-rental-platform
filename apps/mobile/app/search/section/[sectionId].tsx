import { View, Text, FlatList, RefreshControl } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { Spinner } from "heroui-native";
import ScreenWrapper from "components/layout/ScreenWrapper";
import StandardHeader from "components/layout/StandardHeader";
import ApartmentCard from "components/cards/ApartmentCard";
import { supabase } from "@repo/supabase";
import { useColors } from "hooks/useTheme";
import { useFavorites } from "@/hooks/favorites";
import { FLOATING_TAB_BAR_HEIGHT, FLOATING_TAB_BAR_BOTTOM_OFFSET } from "@/app/(tabs)/components/CustomTabBar";

function transformApartments(data: any[]) {
  return data.map((apt: any) => {
    const images = apt.apartment_images ?? [];
    const cover = images.find((img: any) => img.is_cover);
    const earliest = [...images].sort(
      (a: any, b: any) => new Date(a.created_at ?? 0).getTime() - new Date(b.created_at ?? 0).getTime()
    )[0];
    const thumbnailUrl = (cover?.url_thumb || cover?.url) ?? (earliest?.url_thumb || earliest?.url) ?? undefined;
    return {
      id: apt.id,
      thumbnail: thumbnailUrl ? { uri: thumbnailUrl } : undefined,
      name: apt.name,
      location: `${apt.barangay}, ${apt.city}`,
      ratings: apt.average_rating?.toFixed(1) ?? "0.0",
      monthlyRent: apt.monthly_rent ?? 0,
      noBedroom: apt.no_bedrooms ?? 0,
      noBathroom: apt.no_bathrooms ?? 0,
      areaSqm: apt.area_sqm ?? 0,
      isVerified: apt.is_verified,
      isGrid: true,
    };
  });
}

export default function SectionDetail() {
  const { sectionId, title, city, search } = useLocalSearchParams<{
    sectionId: string;
    title?: string;
    city?: string;
    search?: string;
  }>();
  const router = useRouter();
  const { colors } = useColors();
  const { isFavorite, toggleFavorite } = useFavorites();

  const selectedCity = (city as string) ?? "CAMANAVA";
  const searchQuery = (search as string) ?? "";

  const query = useQuery({
    queryKey: ["searchSectionDetail", sectionId, selectedCity, searchQuery],
    queryFn: async ({ signal }) => {
      // Reuse batch RPC and pick section
      const { data, error } = await supabase
        .rpc("get_search_sections", {
          p_city: selectedCity,
          p_search: searchQuery || null,
          p_filters: {} as any,
          p_limit: 50,
        })
        .abortSignal(signal as any);
      if (error) throw error;
      const sections = (data as any)?.sections ?? [];
      const section = sections.find((s: any) => s.id === sectionId);
      return transformApartments(section?.apartments ?? []);
    },
    staleTime: 30_000,
  });

  const apartments = query.data ?? [];

  if (query.isLoading) {
    return (
      <ScreenWrapper header={<StandardHeader title={(title as string) ?? "See All"} />} className="p-5">
        <View className="flex-1 items-center justify-center">
          <Spinner size="lg" color={colors.primary} />
        </View>
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper
      header={<StandardHeader title={(title as string) ?? sectionId ?? "See All"} />}
      noBottomPadding
    >
      <FlatList
        data={apartments}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={{ paddingHorizontal: 16, gap: 8 }}
        contentContainerStyle={{
          paddingBottom: FLOATING_TAB_BAR_HEIGHT + FLOATING_TAB_BAR_BOTTOM_OFFSET,
          gap: 16,
          paddingTop: 16,
        }}
        renderItem={({ item }) => (
          <ApartmentCard
            {...item}
            isGrid={true}
            isFavorite={isFavorite(item.id)}
            onPress={() => router.push(`/apartment/${item.id}` as any)}
            onPressFavorite={() => {
              void toggleFavorite(item.id);
            }}
          />
        )}
        ListEmptyComponent={
          <View className="flex-1 items-center justify-center py-10">
            <Text className="text-lg text-gray-500 font-nunitoSemiBold">No apartments found</Text>
          </View>
        }
        refreshControl={
          <RefreshControl
            refreshing={query.isFetching && !query.isLoading}
            onRefresh={() => query.refetch()}
            colors={["transparent"]}
            tintColor="transparent"
            progressBackgroundColor="transparent"
          />
        }
      />
    </ScreenWrapper>
  );
}
