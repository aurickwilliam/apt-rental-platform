import { useState } from "react";
import { FlatList, Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Button, Spinner } from "heroui-native";
import { IconFilter2 } from "@tabler/icons-react-native";
import ScreenWrapper from "@/components/layout/ScreenWrapper";
import StandardHeader from "@/components/layout/StandardHeader";
import { PullToRefreshControl, PullToRefreshIndicator } from "@/components/display/PullToRefresh";
import MaintenanceDashboardRequestCard from "@/components/maintenance/MaintenanceDashboardRequestCard";
import MaintenanceHistoryFilterSheet from "@/components/maintenance/MaintenanceHistoryFilterSheet";
import { useMaintenanceDashboard } from "@/hooks/maintenance-requests/useMaintenanceDashboard";
import { emptyHistoryFilters, filterMaintenanceHistory, historyFilterCount } from "@/utils/maintenance-history-filters";
import { MAINTENANCE_DASHBOARD_LIMIT } from "@/constants/maintenance-dashboard";
import { useColors } from "@/hooks/useTheme";

export default function MaintenanceHistoryList() {
  const { apartmentId } = useLocalSearchParams<{ apartmentId: string }>();
  const router = useRouter();
  const { colors } = useColors();
  const { requests, identityError, identityLoading, accountKey, refresh } = useMaintenanceDashboard(apartmentId, { includeOverview: false });
  const [filters, setFilters] = useState(emptyHistoryFilters);
  const [filterOpen, setFilterOpen] = useState(false);
  const [previousAccount, setPreviousAccount] = useState(accountKey);
  const [refreshing, setRefreshing] = useState(false);
  if (previousAccount !== accountKey) {
    setPreviousAccount(accountKey);
    setFilters(emptyHistoryFilters());
    setFilterOpen(false);
  }
  const loading = identityLoading || (requests.isPending && !identityError);
  const error = identityError ?? (requests.isError ? "Couldn't load maintenance history." : null);
  const history = error ? [] : requests.data?.history ?? [];
  const visible = filterMaintenanceHistory(history, filters);
  const activeFilters = historyFilterCount(filters);
  const onRefresh = async () => {
    setRefreshing(true);
    try { await refresh(); } finally { setRefreshing(false); }
  };
  return (
    <ScreenWrapper background="grouped" className="px-5" dismissKeyboardOnTouch={false}
      header={<StandardHeader title="Maintenance history" rightComponent={
        <Button isIconOnly variant="ghost" className="size-11" accessibilityLabel={activeFilters ? `Filter maintenance history, ${activeFilters} ${activeFilters === 1 ? "filter" : "filters"} applied` : "Filter maintenance history"} onPress={() => setFilterOpen(true)}>
          <IconFilter2 size={22} color={colors.secondaryForeground} />
          {activeFilters > 0 && <View className="absolute right-0 top-0 size-2 rounded-full bg-white" />}
        </Button>
      } />}
    >
      <FlatList data={loading || error ? [] : visible} keyExtractor={(request) => request.id}
        contentContainerStyle={{ gap: 8, paddingTop: 16, paddingBottom: 24 }}
        refreshControl={<PullToRefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListHeaderComponent={<View className="gap-3 pb-2">
          <PullToRefreshIndicator refreshing={refreshing} />
          <Text className="font-inter text-sm text-muted">Resolved and cancelled requests, newest first.</Text>
          {!loading && !error && <Text className="font-nunitoSemiBold text-sm text-foreground">{visible.length} {visible.length === 1 ? "request" : "requests"}{activeFilters ? " matching your filters" : ""}</Text>}
        </View>}
        renderItem={({ item }) => <MaintenanceDashboardRequestCard request={item} onPress={(request) => router.push({ pathname: "/tenant/maintenance-details", params: { requestId: request.id, apartmentId: request.apartment_id } })} />}
        ListEmptyComponent={loading ? <Spinner accessibilityLabel="Loading maintenance history" /> : error ? (
          <View className="gap-3"><Text accessibilityRole="alert" className="font-inter text-sm text-danger">{error}</Text><Button variant="secondary" onPress={() => void refresh()}><Button.Label>Retry history</Button.Label></Button></View>
        ) : <View className="gap-3"><Text className="font-inter text-sm text-muted">{activeFilters ? "No requests match your filters." : "No resolved or cancelled requests yet."}</Text>{activeFilters > 0 && <Button variant="secondary" onPress={() => setFilters(emptyHistoryFilters())}><Button.Label>Clear filters</Button.Label></Button>}</View>}
        ListFooterComponent={!loading && !error && requests.data?.historyLimited ? <Text className="pt-3 font-inter text-xs text-muted">History is limited to the latest {MAINTENANCE_DASHBOARD_LIMIT} requests. Filters apply to those loaded requests.</Text> : null}
      />
      <MaintenanceHistoryFilterSheet isOpen={filterOpen} onOpenChange={setFilterOpen} filters={filters} onApply={setFilters} />
    </ScreenWrapper>
  );
}
