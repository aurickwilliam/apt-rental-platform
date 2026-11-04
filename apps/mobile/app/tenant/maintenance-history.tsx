import { View, FlatList } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Spinner } from "heroui-native";

import ScreenWrapper from "components/layout/ScreenWrapper";
import MaintenanceRequestCard from "@/app/(tabs)/components/rentals/MaintenanceRequestCard";
import { useMaintenanceRequestHistory } from "@/hooks/maintenance-requests";
import { useColors } from "@/hooks/useTheme";
import StandardHeader from "@/components/layout/StandardHeader";
import { useMaintenanceFocusRefresh } from "@/hooks/maintenance-requests/useMaintenanceFocusRefresh";
import { IconTool } from "@tabler/icons-react-native";
import EmptyState from "@/components/display/EmptyState";

export default function MaintenanceHistory() {
  const router = useRouter();
  const { colors } = useColors();
  const { apartmentId } = useLocalSearchParams<{ apartmentId: string }>();

  const { requests, loading } = useMaintenanceRequestHistory({ apartmentId });
  useMaintenanceFocusRefresh(apartmentId);

  if (loading) {
    return (
      <ScreenWrapper className="p-5">
        <View className="flex-1 items-center justify-center">
          <Spinner size="lg" color={colors.primary} />
        </View>
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper
      className="p-5"
      header={<StandardHeader title="Maintenance Request History" />}
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
                pathname: "/tenant/maintenance-details",
                params: { requestId: item.id, apartmentId: item.apartment_id },
              })
            }
          />
        )}
        ListEmptyComponent={
          <EmptyState
            icon={IconTool}
            title="No maintenance requests yet"
            description="Requests you send to your landlord will appear here."
          />
        }
      />
    </ScreenWrapper>
  );
}
