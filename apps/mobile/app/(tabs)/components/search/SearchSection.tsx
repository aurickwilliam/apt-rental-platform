import { View, Text, FlatList, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { IconChevronRight } from "@tabler/icons-react-native";
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
    <View className="gap-3">
      <View className="flex-row items-center justify-between px-5">
        <View className="h-5 w-32 bg-surface-tertiary rounded-lg" />
        <View className="h-5 w-5 bg-surface-tertiary rounded-full" />
      </View>
      <View className="flex-row gap-3 px-5">
        {[0, 1, 2].map((i) => (
          <View key={i} style={{ width: CARD_WIDTH }} className="h-60 bg-surface-tertiary rounded-2xl opacity-60" />
        ))}
      </View>
    </View>
  );
}

export function SearchGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <View className="flex-1 gap-4 px-4 pt-2">
      <View className="flex-row flex-wrap gap-2">
        {Array.from({ length: count }).map((_, i) => (
          <View
            key={i}
            className="bg-surface rounded-2xl overflow-hidden border border-border"
            style={{ width: "48.5%" as any }}
          >
            <View className="aspect-square bg-surface-tertiary opacity-60" />
            <View className="p-2 gap-2">
              <View className="h-4 w-3/4 bg-surface-tertiary rounded-lg opacity-60" />
              <View className="h-3 w-1/2 bg-surface-tertiary rounded-lg opacity-60" />
              <View className="flex-row justify-between items-center mt-1">
                <View className="h-4 w-16 bg-surface-tertiary rounded-lg opacity-60" />
                <View className="h-3 w-10 bg-surface-tertiary rounded-lg opacity-60" />
              </View>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}
