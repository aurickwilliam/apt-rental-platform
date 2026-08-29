import { View, Text, FlatList, Pressable } from "react-native";
import { useRouter } from "expo-router";
import ApartmentCard from "components/cards/ApartmentCard";
import type { SearchSection as SearchSectionType } from "./useSearchSections";

type Props = {
  section: SearchSectionType;
  isFavorite: (id: string) => boolean;
  onToggleFavorite: (id: string) => void | Promise<void>;
  onPressApartment: (id: string) => void;
};

export default function SearchSection({ section, isFavorite, onToggleFavorite, onPressApartment }: Props) {
  const router = useRouter();

  if (!section.apartments.length) return null;

  const handleSeeAll = () => {
    // Navigate to section detail: reuse search with filter or dedicated route
    // For now, push to search section screen with sectionId
    router.push({
      pathname: "/search/section/[sectionId]",
      params: { sectionId: section.id, title: section.title },
    } as any);
  };

  return (
    <View className="gap-3">
      <View className="flex-row items-center justify-between px-5">
        <Text className="text-foreground text-lg font-nunitoSemiBold">{section.title}</Text>
        <Pressable onPress={handleSeeAll} hitSlop={8}>
          <Text className="text-primary text-sm font-nunitoSemiBold">See All</Text>
        </Pressable>
      </View>

      <FlatList
        horizontal
        data={section.apartments}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={{ marginLeft: 16 }}>
            <ApartmentCard
              {...item}
              isGrid={true}
              isFavorite={isFavorite(item.id)}
              onPress={() => onPressApartment(item.id)}
              onPressFavorite={() => {
                void onToggleFavorite(item.id);
              }}
            />
          </View>
        )}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingRight: 16, gap: 12 }}
        snapToInterval={176}
        decelerationRate="fast"
        initialNumToRender={4}
        windowSize={5}
        maxToRenderPerBatch={4}
        removeClippedSubviews
        getItemLayout={(_, index) => ({ length: 176, offset: 176 * index, index })}
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
  // Reuse horizontal skeleton: 3 placeholder cards
  return (
    <View className="gap-3">
      <View className="flex-row items-center justify-between px-5">
        <View className="h-5 w-32 bg-surface-tertiary rounded-lg" />
        <View className="h-4 w-12 bg-surface-tertiary rounded-lg" />
      </View>
      <View className="flex-row gap-3 px-5">
        {[0, 1, 2].map((i) => (
          <View key={i} className="w-40 h-56 bg-surface-tertiary rounded-2xl" />
        ))}
      </View>
    </View>
  );
}
