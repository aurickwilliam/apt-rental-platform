import { useMemo, useState } from "react";
import { FlatList, RefreshControl, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { SearchField, Button } from "heroui-native";
import { ListFilter } from "lucide-react-native";

import ScreenWrapper from "@/components/layout/ScreenWrapper";
import StandardHeader from "@/components/layout/StandardHeader";
import MaintenanceRequestCard from "./components/MaintenanceRequestCard";
import MaintenanceRequestCardSkeleton from "./components/MaintenanceRequestCardSkeleton";
import EmptyMaintenanceRequestsList from "./components/EmptyMaintenanceRequestsList";
import MaintenanceRequestFilterSheet, {
  type MaintenanceRequestFilters,
} from "./components/MaintenanceRequestFilterSheet";

import { formatDate } from "@repo/utils";
import { useLandlordMaintenanceRequests } from "@/hooks/maintenance-requests";
import { useColors } from "@/hooks/useTheme";

const EMPTY_FILTERS: MaintenanceRequestFilters = {
  statuses: [],
  urgencies: [],
  locations: [],
};

export default function MaintenanceRequests() {
  const router = useRouter();
  const { requests, loading, refetch } = useLandlordMaintenanceRequests();
  const { colors } = useColors();

  const [searchQuery, setSearchQuery] = useState("");
  const [filterOpen, setFilterOpen] = useState(false);
  const [filters, setFilters] = useState<MaintenanceRequestFilters>(EMPTY_FILTERS);
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const activeCount =
    filters.statuses.length + filters.urgencies.length + filters.locations.length;

  const filteredRequests = useMemo(() => {
    let result = requests;

    const query = searchQuery.trim().toLowerCase();
    if (query) {
      result = result.filter(
        (request) =>
          request.issue_title.toLowerCase().includes(query) ||
          request.apartment_name.toLowerCase().includes(query) ||
          request.tenant_name.toLowerCase().includes(query)
      );
    }

    if (filters.statuses.length > 0) {
      result = result.filter((request) => filters.statuses.includes(request.status));
    }

    if (filters.urgencies.length > 0) {
      result = result.filter((request) => filters.urgencies.includes(request.urgency));
    }

    if (filters.locations.length > 0) {
      result = result.filter((request) =>
        filters.locations.includes(request.apartment_city.toLowerCase())
      );
    }

    return result;
  }, [requests, searchQuery, filters]);

  const handleRequestPress = (requestId: string) => {
    router.push(`/landlord/maintenance-requests/${requestId}`);
  };

  // Only true on the very first fetch, before we have any cached requests
  const isInitialLoad = loading && requests.length === 0;

  return (
    <ScreenWrapper
      header={<StandardHeader title="Maintenance Requests" />}
      scrollable={false}
    >
      <FlatList
        data={filteredRequests}
        keyExtractor={(item) => item.id}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingTop: 16,
          paddingBottom: 30,
          flexGrow: filteredRequests.length === 0 ? 1 : 0,
        }}
        ListHeaderComponent={
          <View className="gap-4">
            <View className="flex-row items-center gap-2">
              <View className="flex-1">
                <SearchField value={searchQuery} onChange={setSearchQuery}>
                  <SearchField.Group>
                    <SearchField.SearchIcon />
                    <SearchField.Input
                      placeholder="Search issues, tenants, apartments..."
                      className="flex-1 shadow-none"
                    />
                    <SearchField.ClearButton />
                  </SearchField.Group>
                </SearchField>
              </View>

              <View className="relative">
                <Button
                  onPress={() => setFilterOpen(true)}
                  variant="tertiary"
                  isIconOnly
                >
                  <ListFilter size={18} color={colors.textPrimary} />
                </Button>

                {activeCount > 0 && (
                  <View className="absolute -top-0.5 -right-0.5 min-w-4 h-4 rounded-full bg-accent items-center justify-center">
                    <Text className="text-white text-[10px] font-interMedium leading-none -mb-0.5">
                      {activeCount}
                    </Text>
                  </View>
                )}
              </View>
            </View>

            {!isInitialLoad && (
              <Text className="text-gray-500 text-sm font-inter mb-3">
                Total: {filteredRequests.length}
              </Text>
            )}

            {/* Skeletons shown inline while loading */}
            {isInitialLoad && (
              <View className="gap-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <MaintenanceRequestCardSkeleton key={i} />
                ))}
              </View>
            )}
          </View>
        }
        ItemSeparatorComponent={() => <View className="h-3" />}
        ListEmptyComponent={isInitialLoad ? null : <EmptyMaintenanceRequestsList />}
        renderItem={({ item }) => (
          <MaintenanceRequestCard
            issueTitle={item.issue_title}
            apartmentName={item.apartment_name}
            tenantName={item.tenant_name}
            reportedDate={formatDate(item.reported_at, "medium")}
            status={item.status}
            onPress={() => handleRequestPress(item.id)}
          />
        )}
      />

      <MaintenanceRequestFilterSheet
        isOpen={filterOpen}
        onOpenChange={setFilterOpen}
        filters={filters}
        onChange={setFilters}
      />
    </ScreenWrapper>
  );
}
