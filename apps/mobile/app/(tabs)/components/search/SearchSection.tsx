import { View, Text, FlatList, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { IconChevronRight } from "@tabler/icons-react-native";
import { SkeletonGroup } from "heroui-native";
import ApartmentCard from "components/cards/ApartmentCard";
import { useColors } from "hooks/useTheme";
import type { SearchSection as SearchSectionType } from "./useSearchSections";

const CARD_WIDTH = 180;
const CARD_GAP = 12;
const SNAP_INTERVAL = CARD_WIDTH + CARD_GAP;

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

        <Pressable
          onPress={handleSeeAll}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={`See all ${section.title}`}
          className="p-1"
        >
          <IconChevronRight size={20} color={colors.primary} />
        </Pressable>
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

export function SearchGridSkeleton({ count = 6, isGrid = true }: { count?: number; isGrid?: boolean }) {
  return (
    <SkeletonGroup isLoading isSkeletonOnly variant="shimmer" className="flex-1 gap-4 pt-2">
      <View className="flex-row flex-wrap gap-2">
        {Array.from({ length: count }).map((_, i) => (
          <View
            key={i}
            className="bg-surface rounded-2xl overflow-hidden border border-border"
            style={{ width: (isGrid ? "48%" : "100%") as any, alignSelf: isGrid ? "auto" : "center" }}
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
        ))}
      </View>
    </SkeletonGroup>
  );
}
