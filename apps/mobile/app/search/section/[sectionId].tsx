import { FlatList } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { parseBrowseRowSpec, type BrowseRowPreferences } from "@repo/utils";
import { useSearchSectionPage } from "@/hooks/search/useSearchSectionPage";
import { useBrowseRowPage } from "@/hooks/search/useBrowseRowPage";
import { fetchRecommendedCards } from "@/service/search/browseRowsService";
import { RECOMMENDED_SECTION_ID } from "@/service/search/browseDiscoveryService";
import { useMemo, useState } from "react";
import { Button } from "heroui-native";
import { IconSearchOff, IconLayoutGrid, IconLayoutRows } from "@tabler/icons-react-native";
import { SearchGridSkeleton } from "@/app/(tabs)/components/search/SearchSection";
import ScreenWrapper from "components/layout/ScreenWrapper";
import StandardHeader from "components/layout/StandardHeader";
import ApartmentCard from "components/cards/ApartmentCard";
import EmptyState from "components/display/EmptyState";
import { useFavorites } from "@/hooks/favorites";
import { useUserPreferences } from "@/hooks/preferences/useUserPreferences";
import { FLOATING_TAB_BAR_HEIGHT, FLOATING_TAB_BAR_BOTTOM_OFFSET } from "@/components/layout/CustomTabBar";



// Recommended's See All lists more than the 15 on the Explore row.
const RECOMMENDED_SEE_ALL_LIMIT = 50;

// The spec arrives as a route param: rebuild it from known fields only.
function parseSpecParam(value: string | undefined) {
  if (!value) return null;
  try {
    return parseBrowseRowSpec(JSON.parse(value));
  } catch {
    return null;
  }
}

export default function SectionDetail() {
  const { sectionId, title, city, search, spec } = useLocalSearchParams<{
    sectionId: string;
    title?: string;
    city?: string;
    search?: string;
    spec?: string;
  }>();
  const router = useRouter();
  const { isFavorite, toggleFavorite } = useFavorites();

  const selectedCity = (city as string) ?? "CAMANAVA";
  const searchQuery = (search as string) ?? "";
  const { preferences, isLoading: prefsLoading } = useUserPreferences();

  const isRecommended = sectionId === RECOMMENDED_SECTION_ID;
  const rowSpec = useMemo(() => parseSpecParam(spec), [spec]);

  // Recommended has no server cohort: rank a pool of listings by the saved preferences.
  const recommendedQuery = useQuery({
    enabled: isRecommended && preferences !== null,
    queryKey: ["searchSectionRecommended", preferences ? JSON.stringify(preferences) : null] as const,
    queryFn: ({ signal }) =>
      fetchRecommendedCards(preferences as BrowseRowPreferences, RECOMMENDED_SEE_ALL_LIMIT, signal),
    staleTime: 30_000,
  });

  const rowQuery = useBrowseRowPage({ spec: rowSpec, enabled: !isRecommended });

  const pagedQuery = useSearchSectionPage({
    sectionId: sectionId as string,
    selectedCity,
    committedSearch: searchQuery,
    enabled: !isRecommended && rowSpec === null,
  });

  const activePaged = rowSpec ? rowQuery : pagedQuery;
  const isLoading = isRecommended
    ? recommendedQuery.isLoading || (preferences === null && prefsLoading)
    : activePaged.isLoading;
  const apartments = useMemo(() => {
    if (isRecommended) return recommendedQuery.data ?? [];
    if (rowSpec) return rowQuery.data?.pages.flat() ?? [];
    return pagedQuery.data?.pages.flatMap((page) => page.apartments) ?? [];
  }, [isRecommended, rowSpec, recommendedQuery.data, rowQuery.data, pagedQuery.data]);
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
          if (!isRecommended && activePaged.hasNextPage && !activePaged.isFetchingNextPage) {
            void activePaged.fetchNextPage();
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
            icon={IconSearchOff}
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
