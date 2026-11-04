import { useState } from "react";
import { FlatList, Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Button, Card, Spinner } from "heroui-native";
import { IconChevronRight } from "@tabler/icons-react-native";
import ScreenWrapper from "@/components/layout/ScreenWrapper";
import StandardHeader from "@/components/layout/StandardHeader";
import { PullToRefreshControl, PullToRefreshIndicator } from "@/components/display/PullToRefresh";
import MaintenanceSectionHeading from "@/components/maintenance/MaintenanceSectionHeading";
import MaintenanceDashboardRequestCard from "@/components/maintenance/MaintenanceDashboardRequestCard";
import MaintenanceOverview from "@/components/maintenance/MaintenanceOverview";
import { useMaintenanceDashboard } from "@/hooks/maintenance-requests/useMaintenanceDashboard";
import { MAINTENANCE_DASHBOARD_LIMIT, MAINTENANCE_PREVIEW_LIMIT } from "@/constants/maintenance-dashboard";
import type { MaintenanceRequest } from "@/service/maintenance-requests/maintenanceService";
import { useColors } from "@/hooks/useTheme";

export default function MaintenanceHistory() {
  const router = useRouter();
  const { colors } = useColors();
  const { apartmentId } = useLocalSearchParams<{ apartmentId: string }>();
  const { requests, overview, refresh, identityError, identityLoading } = useMaintenanceDashboard(apartmentId);
  const [refreshing, setRefreshing] = useState(false);
  const failed = !!identityError || requests.isError;
  const loading = identityLoading || (requests.isPending && !identityError);
  const history = !failed ? requests.data?.history ?? [] : [];
  const openRequest = (request: MaintenanceRequest) => {
    router.push({
      pathname: "/tenant/maintenance-details",
      params: { requestId: request.id, apartmentId: request.apartment_id },
    });
  };
  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await refresh();
    } finally {
      setRefreshing(false);
    }
  };
  return (
    <ScreenWrapper
      header={<StandardHeader title="Maintenance" />}
      background="grouped"
      className="px-5"
      dismissKeyboardOnTouch={false}
    >
      <FlatList
        data={failed || loading ? [] : requests.data?.active ?? []}
        keyExtractor={(request) => request.id}
        contentContainerStyle={{ gap: 12, paddingTop: 16, paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<PullToRefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListHeaderComponent={
          <View className="gap-4">
            <PullToRefreshIndicator refreshing={refreshing} />
            <MaintenanceSectionHeading kind="active" />
          </View>
        }
        renderItem={({ item }) => <MaintenanceDashboardRequestCard request={item} onPress={openRequest} />}
        ListEmptyComponent={loading ? (
          <Spinner accessibilityLabel="Loading maintenance requests" color={colors.primary} />
        ) : failed ? (
          <View className="gap-3 rounded-2xl bg-overlay p-4">
            <Text accessibilityRole="alert" className="font-inter text-sm text-danger">
              {identityError ?? "Couldn't load maintenance requests."}
            </Text>
            <Button variant="secondary" onPress={() => void refresh()}>
              <Button.Label>Retry requests</Button.Label>
            </Button>
          </View>
        ) : (
          <Text className="rounded-2xl bg-overlay p-4 font-inter text-sm text-muted">
            No active maintenance requests. You can request a repair from Rentals.
          </Text>
        )}
        ListFooterComponent={
          <View className="gap-5 pt-2">
            {!failed && requests.data?.activeLimited && (
              <Text className="font-inter text-xs text-muted">
                Showing up to {MAINTENANCE_DASHBOARD_LIMIT} requests per active status. Overview counts all active requests.
              </Text>
            )}
            <MaintenanceOverview
              data={overview.data}
              loading={identityLoading || (overview.isPending && !identityError)}
              error={!!identityError || overview.isError}
              onRetry={() => void refresh()}
            />
            <Card className="rounded-3xl border border-border bg-overlay shadow-none">
              <Card.Body className="gap-4">
                <MaintenanceSectionHeading kind="history" />
                {loading ? (
                  <Spinner accessibilityLabel="Loading request history" />
                ) : failed ? (
                  <Text className="font-inter text-sm text-muted">History is unavailable. Use Retry requests above.</Text>
                ) : history.length === 0 ? (
                  <Text className="font-inter text-sm text-muted">No resolved or cancelled requests yet.</Text>
                ) : (
                  <View className="gap-2">
                    {history.slice(0, MAINTENANCE_PREVIEW_LIMIT).map((request) => (
                      <MaintenanceDashboardRequestCard key={request.id} request={request} onPress={openRequest} />
                    ))}
                  </View>
                )}
                {history.length > MAINTENANCE_PREVIEW_LIMIT && (
                  <Button variant="secondary" size="sm" className="min-h-11 self-end" onPress={() => router.push({ pathname: "/tenant/maintenance-history-list", params: { apartmentId } })}>
                    <Button.Label>See more</Button.Label>
                    <IconChevronRight size={18} color={colors.primaryLightForeground} />
                  </Button>
                )}
              </Card.Body>
            </Card>
          </View>
        }
      />
    </ScreenWrapper>
  );
}
