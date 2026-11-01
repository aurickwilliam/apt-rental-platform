import { View, Text, FlatList, Pressable, useWindowDimensions } from "react-native";
import { useRouter } from "expo-router";
import { IconChevronRight } from "@tabler/icons-react-native";
import { SkeletonGroup } from "heroui-native";
import ApartmentCard from "components/cards/ApartmentCard";
import { useColors } from "hooks/useTheme";
import type { SearchSection as SearchSectionType } from "@/hooks/search/useSearchSections";

const CARD_WIDTH = 180;
const CARD_GAP = 12;
const SNAP_INTERVAL = CARD_WIDTH + CARD_GAP;

// The "All Results" fallback is a one-off preview; the See All RPC has no matching section.
const SECTIONS_WITHOUT_SEE_ALL = ["all_results"];

type Props = {
  section: SearchSectionType;
  isFavorite: (id: string) => boolean;
  onToggleFavorite: (id: string) => void | Promise<void>;
  onPressApartment: (id: string) => void;
};

export default function SearchSection({ section, isFavorite, onToggleFavorite, onPressApartment }: Props) {
  const router = useRouter();
  const { colors } = useColors();

  if (!section.apartments.length) return null;

  const handleSeeAll = () => {
    router.push({
      pathname: "/search/section/[sectionId]",
      params: { sectionId: section.id, title: section.title },
    } as any);
  };

  return (
    <View className="gap-3">
      <View className="flex-row items-center justify-between px-5">
        <Text className="text-foreground text-lg font-nunitoBold">
          {section.title}
        </Text>

        {SECTIONS_WITHOUT_SEE_ALL.includes(section.id) ? null : (
          <Pressable
            onPress={handleSeeAll}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={`See all ${section.title}`}
            className="p-1"
          >
            <IconChevronRight size={20} color={colors.primary} />
          </Pressable>
        )}
      </View>

      <FlatList
        horizontal
        data={section.apartments}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <ApartmentCard
            {...item}
            fixedWidth={CARD_WIDTH}
            isGrid={true}
            isFavorite={isFavorite(item.id)}
            onPress={() => onPressApartment(item.id)}
            onPressFavorite={() => {
              void onToggleFavorite(item.id);
            }}
          />
        )}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingLeft: 16, paddingRight: 16, gap: CARD_GAP }}
        snapToInterval={SNAP_INTERVAL}
        decelerationRate="fast"
        initialNumToRender={4}
        windowSize={5}
        maxToRenderPerBatch={4}
        removeClippedSubviews
        nestedScrollEnabled
        keyboardShouldPersistTaps="handled"
        getItemLayout={(_, index) => ({ length: SNAP_INTERVAL, offset: SNAP_INTERVAL * index, index })}
        ListEmptyComponent={
          <View className="py-4 items-center px-5">
            <Text className="text-muted">No apartments</Text>
          </View>
        }
      />
    </View>
  );
}

export function SearchSectionSkeleton() {
  return (
    <SkeletonGroup isLoading isSkeletonOnly variant="shimmer" className="gap-3">
      <View className="flex-row items-center justify-between px-5">
        <SkeletonGroup.Item className="h-5 w-32 rounded-lg" />
        <SkeletonGroup.Item className="h-5 w-5 rounded-full" />
      </View>
      <View className="flex-row gap-3 px-5">
        {[0, 1, 2].map((i) => (
          <View
            key={i}
            style={{ width: CARD_WIDTH }}
            className="bg-surface rounded-2xl overflow-hidden border border-border"
          >
            <SkeletonGroup.Item className="aspect-square" />
            <View className="p-2 gap-2">
              <SkeletonGroup.Item className="h-4 w-3/4 rounded-lg" />
              <SkeletonGroup.Item className="h-3 w-1/2 rounded-lg" />
              <View className="flex-row justify-between items-center mt-1">
                <SkeletonGroup.Item className="h-4 w-16 rounded-lg" />
                <SkeletonGroup.Item className="h-3 w-10 rounded-lg" />
              </View>
            </View>
          </View>
        ))}
      </View>
    </SkeletonGroup>
  );
}

// Same metrics as ApartmentCard: 16px screen padding, 8px between grid columns,
// 16px between rows, card width derived from the window.
const GRID_HORIZONTAL_PADDING = 16;
const GRID_COLUMN_GAP = 8;
const GRID_ROW_GAP = 16;

function GridCardSkeleton({ width, isGrid }: { width: number; isGrid: boolean }) {
  return (
    <View
      className="bg-surface rounded-2xl overflow-hidden border border-border"
      style={{ width }}
    >
      <SkeletonGroup.Item className="aspect-square" />
      <View className={isGrid ? "p-2 gap-2" : "p-3 gap-3"}>
        <SkeletonGroup.Item className={isGrid ? "h-4 w-3/4 rounded-lg" : "h-5 w-3/4 rounded-lg"} />
        <SkeletonGroup.Item className={isGrid ? "h-3 w-1/2 rounded-lg" : "h-4 w-1/2 rounded-lg"} />
        {!isGrid && (
          <View className="flex-row flex-wrap">
            <View className="flex-row w-2/6 gap-1 items-center">
              <SkeletonGroup.Item className="h-3 w-16 rounded-md" />
            </View>
            <View className="flex-row w-2/6 gap-1 items-center">
              <SkeletonGroup.Item className="h-3 w-16 rounded-md" />
            </View>
            <View className="flex-row w-2/6 gap-1 items-center">
              <SkeletonGroup.Item className="h-3 w-12 rounded-md" />
            </View>
          </View>
        )}
        <View className="flex-row justify-between items-center mt-1">
          <SkeletonGroup.Item className={isGrid ? "h-4 w-16 rounded-lg" : "h-5 w-20 rounded-lg"} />
          <SkeletonGroup.Item className={isGrid ? "h-3 w-10 rounded-lg" : "h-4 w-12 rounded-lg"} />
        </View>
      </View>
    </View>
  );
}

export function SearchGridSkeleton({
  count = 6,
  isGrid = true,
  paddingTop = 0,
}: {
  count?: number;
  isGrid?: boolean;
  paddingTop?: number;
}) {
  const { width } = useWindowDimensions();
  const cardWidth = isGrid
    ? (width - GRID_HORIZONTAL_PADDING * 2 - GRID_COLUMN_GAP) / 2
    : width - GRID_HORIZONTAL_PADDING * 2;
  const columns = isGrid ? 2 : 1;
  const rows = Math.ceil(count / columns);

  return (
    <SkeletonGroup
      isLoading
      isSkeletonOnly
      variant="shimmer"
      className="flex-1"
      style={{
        paddingTop,
        paddingHorizontal: GRID_HORIZONTAL_PADDING,
        gap: GRID_ROW_GAP,
      }}
    >
      {Array.from({ length: rows }).map((_, row) => (
        <View key={row} className="flex-row" style={{ gap: GRID_COLUMN_GAP }}>
          {Array.from({ length: columns }).map((__, col) => (
            <GridCardSkeleton key={col} width={cardWidth} isGrid={isGrid} />
          ))}
        </View>
      ))}
    </SkeletonGroup>
  );
}
