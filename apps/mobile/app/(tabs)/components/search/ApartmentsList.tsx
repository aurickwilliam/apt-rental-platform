import {
  View,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  Text,
} from 'react-native';

import ApartmentCard from 'components/cards/ApartmentCard';

import { COLORS } from '@repo/constants';

type ApartmentsListProps = {
  apartments: ApartmentCardProps[];
  isGridView: boolean;
  isFavorite: (id: string) => boolean;
  onPressApartment: (id: string) => void;
  onToggleFavorite: (id: string) => void | Promise<void>;
  loading: boolean;
  refreshing: boolean;
  loadingMore: boolean;
  error: string | null;
  onRefresh: () => void;
  onLoadMore: () => void;
};

export default function ApartmentsList({
  apartments,
  isGridView,
  isFavorite,
  onPressApartment,
  onToggleFavorite,
  loading,
  refreshing,
  loadingMore,
  error,
  onRefresh,
  onLoadMore,
}: ApartmentsListProps) {
  const renderApartmentCard = ({ item }: { item: ApartmentCardProps }) => (
    <ApartmentCard
      {...item}
      isFavorite={isFavorite(item.id)}
      isGrid={isGridView}
      onPress={() => onPressApartment(item.id)}
      onPressFavorite={() => {
        void onToggleFavorite(item.id);
      }}
    />
  );

  const renderEmptyState = () => (
    <View className='flex-1 items-center justify-center py-10'>
      <Text className='text-lg text-grey-500 font-poppinsMedium'>
        {error ?? 'No apartments found'}
      </Text>
    </View>
  );

  const renderFooter = () => {
    if (!loadingMore) return null;
    return (
      <View className='py-4 items-center'>
        <ActivityIndicator size='small' color={COLORS.primary} />
      </View>
    );
  };

  if (loading && !refreshing) {
    return (
      <View className='flex-1 items-center justify-center'>
        <ActivityIndicator size='large' color={COLORS.primary} />
      </View>
    );
  }

  return (
    <FlatList
      key={isGridView ? 'grid' : 'list'}
      data={apartments}
      renderItem={renderApartmentCard}
      keyExtractor={(item) => item.id.toString()}
      numColumns={isGridView ? 2 : 1}
      columnWrapperStyle={isGridView ? { paddingHorizontal: 16, gap: 8 } : undefined}
      contentContainerStyle={{ paddingBottom: 16, gap: 16 }}
      ListEmptyComponent={renderEmptyState}
      ListFooterComponent={renderFooter}
      onEndReached={onLoadMore}
      onEndReachedThreshold={0.4}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={[COLORS.primary]}
          tintColor={COLORS.primary}
        />
      }
    />
  );
}
