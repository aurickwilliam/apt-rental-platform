import { View, Text, FlatList, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

import ScreenWrapper from 'components/layout/ScreenWrapper';
import MaintenanceRequestCard from '@/app/(tabs)/components/rentals/MaintenanceRequestCard';
import { useMaintenanceRequestHistory } from '@/hooks/maintenance-requests';
import { useColors } from '@/hooks/useTheme';
import StandardHeader from '@/components/layout/StandardHeader';

export default function MaintenanceHistory() {
  const router = useRouter();
  const { colors } = useColors();
  const { apartmentId } = useLocalSearchParams<{ apartmentId: string }>();

  const { requests, loading } = useMaintenanceRequestHistory({ apartmentId });

  if (loading) {
    return (
      <ScreenWrapper className="p-5">
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper
      className="p-5"
      header={<StandardHeader title='Maintenance Request History' />}
    >

      <FlatList
        data={requests}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ gap: 12, paddingBottom: 40 }}
        renderItem={({ item }) => (
          <MaintenanceRequestCard
            request={item}
            onPress={() =>
              router.push({
                pathname: '/tenant/maintenance-details',
                params: { request: JSON.stringify(item) },
              })
            }
          />
        )}
        ListEmptyComponent={
          <Text className="text-gray500 text-center mt-10">
            No maintenance requests yet.
          </Text>
        }
      />
    </ScreenWrapper>
  );
}
