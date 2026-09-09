import { FlatList } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Button } from "heroui-native";
import { IconSearchOff, IconLayoutGrid, IconLayoutRows } from "@tabler/icons-react-native";
import { SearchGridSkeleton } from "@/app/(tabs)/components/search/SearchSection";
import ScreenWrapper from "components/layout/ScreenWrapper";
import StandardHeader from "components/layout/StandardHeader";
import ApartmentCard from "components/cards/ApartmentCard";
import EmptyState from "components/display/EmptyState";
import { supabase } from "@repo/supabase";
import { useColors } from "hooks/useTheme";
import { useFavorites } from "@/hooks/favorites";
import { useUserPreferences } from "@/hooks/preferences/useUserPreferences";
import { transformApartments, scorePreferences } from "@/app/(tabs)/components/search/useSearchSections";
import { FLOATING_TAB_BAR_HEIGHT, FLOATING_TAB_BAR_BOTTOM_OFFSET } from "@/app/(tabs)/components/CustomTabBar";



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
  const { preferences } = useUserPreferences();

  const query = useQuery({
    queryKey: ["searchSectionDetail", sectionId, selectedCity, searchQuery, preferences ? JSON.stringify(preferences) : null],
    queryFn: async ({ signal }) => {
      // For personalized sections (for_you, in_city), compute scored pool from same RPC; they don't exist server-side
      const isPersonalizedSection = sectionId === "for_you" || sectionId === "in_city";
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
      if (isPersonalizedSection) {
        // Pool all raw apartments from all sections, score by preferences if available
        const seen = new Set<string>();
        const pool: any[] = [];
        for (const s of sections) {
          for (const raw of s.apartments ?? []) {
            if (!seen.has(raw.id)) {
              seen.add(raw.id);
              pool.push(raw);
            }
          }
        }
        if (preferences) {
          const scored = pool
            .map((raw: any) => ({ raw, score: scorePreferences(raw, preferences) }))
            .filter((s: any) => s.score > 0)
            .sort((a: any, b: any) => b.score - a.score || (b.raw.average_rating ?? 0) - (a.raw.average_rating ?? 0));
          let rawList = scored.map((s: any) => s.raw);
          if (sectionId === "in_city") {
            rawList = rawList.filter((r: any) => r.city === selectedCity);
          }
          return transformApartments(rawList);
        }
        // No preferences: For you fallback to top rated pool
        let rawList = pool;
        if (sectionId === "in_city") rawList = rawList.filter((r: any) => r.city === selectedCity);
        return transformApartments(rawList);
      }
      const section = sections.find((s: any) => s.id === sectionId);
      return transformApartments(section?.apartments ?? []);
    },
    staleTime: 30_000,
  });

  const apartments = query.data ?? [];
  const [isGridView, setIsGridView] = useState(true);

  if (query.isLoading) {
    return (
      <ScreenWrapper
        header={
          <StandardHeader
            title={(title as string) ?? "See All"}
            rightComponent={
              <Button
                variant="ghost"
                isIconOnly
                size="sm"
                onPress={() => setIsGridView((v) => !v)}
                accessibilityLabel={isGridView ? "Switch to big card view" : "Switch to grid view"}
                accessibilityRole="button"
              >
                {isGridView ? (
                  <IconLayoutGrid size={22} color="white" />
                ) : (
                  <IconLayoutRows size={22} color="white" />
                )}
              </Button>
            }
          />
        }
        className="p-5"
      >
        <SearchGridSkeleton count={isGridView ? 6 : 4} isGrid={isGridView} />
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper
      header={
        <StandardHeader
          title={(title as string) ?? sectionId ?? "See All"}
          rightComponent={
            <Button
              variant="ghost"
              isIconOnly
              size="sm"
              onPress={() => setIsGridView((v) => !v)}
              accessibilityLabel={isGridView ? "Switch to big card view" : "Switch to grid view"}
              accessibilityRole="button"
            >
              {isGridView ? (
                <IconLayoutGrid size={22} color="white" />
              ) : (
                <IconLayoutRows size={22} color="white" />
              )}
            </Button>
          }
        />
      }
      noBottomPadding
    >
      <FlatList
        key={isGridView ? "grid" : "list"}
        data={apartments}
        keyExtractor={(item) => item.id}
        numColumns={isGridView ? 2 : 1}
        columnWrapperStyle={isGridView ? { paddingHorizontal: 16, gap: 8 } : undefined}
        contentContainerStyle={{
          paddingBottom: FLOATING_TAB_BAR_HEIGHT + FLOATING_TAB_BAR_BOTTOM_OFFSET,
          gap: 16,
          paddingTop: 16,
          paddingHorizontal: isGridView ? 0 : 16,
          flexGrow: apartments.length === 0 ? 1 : 0,
        }}
        renderItem={({ item }) => (
          <ApartmentCard
            {...item}
            isGrid={isGridView}
            isFavorite={isFavorite(item.id)}
            onPress={() => router.push(`/apartment/${item.id}` as any)}
            onPressFavorite={() => {
              void toggleFavorite(item.id);
            }}
          />
        )}
        ListEmptyComponent={
          <EmptyState
            variant="tenant"
            icon={<IconSearchOff size={64} color={colors.primary} />}
            title="Nothing here yet"
            description="This section has no listings."
            action={
              <Button onPress={() => router.back()} size="sm" variant="secondary">
                <Button.Label>Go Back</Button.Label>
              </Button>
            }
          />
        }
      />
    </ScreenWrapper>
  );
}
