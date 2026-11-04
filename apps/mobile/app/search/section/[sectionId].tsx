import { FlatList } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { useSearchSectionPage } from "@/hooks/search/useSearchSectionPage";
import { useMemo, useState } from "react";
import { Button } from "heroui-native";
import { IconSearchOff, IconLayoutGrid, IconLayoutRows } from "@tabler/icons-react-native";
import { SearchGridSkeleton } from "@/app/(tabs)/components/search/SearchSection";
import ScreenWrapper from "components/layout/ScreenWrapper";
import StandardHeader from "components/layout/StandardHeader";
import ApartmentCard from "components/cards/ApartmentCard";
import EmptyState from "components/display/EmptyState";
import { useColors } from "hooks/useTheme";
import { useFavorites } from "@/hooks/favorites";
import { useUserPreferences } from "@/hooks/preferences/useUserPreferences";
import { transformApartments } from "@/hooks/search/useSearchSections";
import { fetchPersonalizedCandidates } from "@/service/search/recommendations";
import { hasMeaningfulPreferences, rankCandidates, normalizedRecommendationCity, recommendationPreferenceIssue, RECOMMENDATION_CANDIDATE_LIMIT, RECOMMENDATION_MESSAGES } from "@repo/utils/recommendations";
import { FLOATING_TAB_BAR_HEIGHT, FLOATING_TAB_BAR_BOTTOM_OFFSET } from "@/components/layout/CustomTabBar";



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
  const { recommendationPreferences: preferences, profile } = useUserPreferences();

  const isPersonalizedSection = sectionId === "for_you" || sectionId === "in_city";

  const personalizedQuery = useQuery({
    enabled: isPersonalizedSection && !!profile?.user_id && hasMeaningfulPreferences(preferences),
    queryKey: ["searchSectionDetail", profile?.user_id, sectionId, selectedCity, searchQuery, preferences ? JSON.stringify(preferences) : null],
    queryFn: async ({ signal }) => {
      if (!preferences || !hasMeaningfulPreferences(preferences)) return [];
      const candidates = await fetchPersonalizedCandidates(preferences, signal);
      // The detail page lists every eligible candidate, not just the carousel's 8.
      let rows = rankCandidates(candidates, preferences, RECOMMENDATION_CANDIDATE_LIMIT, { accessibilitySignal: true }).map((item) => item.candidate);
      if (sectionId === "in_city") rows = rows.filter((raw) => normalizedRecommendationCity(raw.city) === normalizedRecommendationCity(selectedCity));
      return transformApartments(rows);
    },
    staleTime: 30_000,
  });

  const pagedQuery = useSearchSectionPage({
    sectionId: sectionId as string,
    selectedCity,
    committedSearch: searchQuery,
    enabled: !isPersonalizedSection,
  });

  const isLoading = isPersonalizedSection ? personalizedQuery.isLoading : pagedQuery.isLoading;
  const apartments = useMemo(
    () =>
      isPersonalizedSection
        ? personalizedQuery.data ?? []
        : pagedQuery.data?.pages.flatMap((page) => page.apartments) ?? [],
    [isPersonalizedSection, personalizedQuery.data, pagedQuery.data],
  );
  const [isGridView, setIsGridView] = useState(true);

  if (isLoading) {
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
      >
        <SearchGridSkeleton count={isGridView ? 6 : 4} isGrid={isGridView} paddingTop={16} />
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
        onEndReached={() => {
          if (!isPersonalizedSection && pagedQuery.hasNextPage && !pagedQuery.isFetchingNextPage) {
            void pagedQuery.fetchNextPage();
          }
        }}
        onEndReachedThreshold={0.5}
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
            title={isPersonalizedSection ? !hasMeaningfulPreferences(preferences) ? "Set your rental preferences" : personalizedQuery.isError ? RECOMMENDATION_MESSAGES.error.title : preferences && recommendationPreferenceIssue(preferences) ? RECOMMENDATION_MESSAGES.invalid.title : RECOMMENDATION_MESSAGES.empty.title : "Nothing here yet"}
            description={isPersonalizedSection ? personalizedQuery.isError ? RECOMMENDATION_MESSAGES.error.description : "Update your rental preferences or browse the other apartment sections." : "This section has no listings."}
            action={
              <Button onPress={isPersonalizedSection ? personalizedQuery.isError ? () => { void personalizedQuery.refetch(); } : () => router.push("/settings/preferences") : () => router.back()} size="sm" variant="secondary">
                <Button.Label>{isPersonalizedSection ? personalizedQuery.isError ? "Try again" : "Update preferences" : "Go Back"}</Button.Label>
              </Button>
            }
          />
        }
      />
    </ScreenWrapper>
  );
}
