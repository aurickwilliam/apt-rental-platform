import { useMemo, useState } from "react";
import { FlatList, RefreshControl, Text, View } from "react-native";
import { useRouter } from "expo-router";

import { SearchField, Spinner } from "heroui-native";

import ScreenWrapper from "@/components/layout/ScreenWrapper";
import StandardHeader from "@/components/layout/StandardHeader";
import MaintenanceRequestCard from "./components/MaintenanceRequestCard";
import EmptyMaintenanceRequestsList from "./components/EmptyMaintenanceRequestsList";

import { formatDate } from "@repo/utils";

import { useLandlordMaintenanceRequests } from "@/hooks/maintenance-requests";
import { useColors } from "@/hooks/useTheme";

export default function MaintenanceRequests() {
  const router = useRouter();
  const { requests, loading, refetch } = useLandlordMaintenanceRequests();
  const [searchQuery, setSearchQuery] = useState("");
  const { colors } = useColors();

  const filteredRequests = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return requests;
    return requests.filter((request) => {
      return (
        request.issue_title.toLowerCase().includes(query) ||
        request.apartment_name.toLowerCase().includes(query) ||
        request.tenant_name.toLowerCase().includes(query)
      );
    });
  }, [requests, searchQuery]);

  const handleRequestPress = (requestId: string) => {
    router.push(`/landlord/maintenance-requests/${requestId}`);
  };

  // Loading state for the initial fetch of maintenance requests
  const isInitialLoad = loading && requests.length === 0;

  if (isInitialLoad) {
    return (
      <ScreenWrapper
        header={<StandardHeader title="Maintenance Requests" />}
        scrollable={false}
      >
        <View className="flex-1 items-center justify-center">
          <Spinner size="lg" color={colors.primary} />
        </View>
      </ScreenWrapper>
    );
  }

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
            refreshing={loading}
            onRefresh={refetch}
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
            <Text className="text-gray-500 text-sm font-inter mb-3">
              Total: {filteredRequests.length}
            </Text>
          </View>
        }
        ItemSeparatorComponent={() => <View className="h-3" />}
        ListEmptyComponent={<EmptyMaintenanceRequestsList />}
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
    </ScreenWrapper>
  );
}
