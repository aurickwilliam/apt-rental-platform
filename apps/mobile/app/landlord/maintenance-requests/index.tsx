import { useMemo, useState } from "react";
import { FlatList, Text, View } from "react-native";
import { useRouter } from "expo-router";

import { IconTool } from "@tabler/icons-react-native";

import { SearchField } from "heroui-native";

import ScreenWrapper from "@/components/layout/ScreenWrapper";
import StandardHeader from "@/components/layout/StandardHeader";
import MaintenanceRequestCard from "@/components/cards/MaintenanceRequestCard";

import { COLORS } from "@repo/constants";
import { formatDate } from "@repo/utils";

import {
  STATUS_ORDER,
  useMaintenanceRequestsStore,
} from "@/stores/useMaintenanceRequestsStore";

function EmptyMaintenanceRequests() {
  return (
    <View className="flex-1 items-center justify-center py-20">
      <View className="bg-white rounded-full p-5 mb-4">
        <IconTool size={32} color={COLORS.light.gray400} />
      </View>
      <Text className="text-text text-lg font-interSemiBold">
        No maintenance requests
      </Text>
      <Text className="text-grey-500 text-sm font-inter text-center mt-1">
        Requests from tenants will appear here.
      </Text>
    </View>
  );
}

export default function MaintenanceRequests() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const requests = useMaintenanceRequestsStore((state) => state.requests);

  const filteredRequests = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    const matches = query
      ? requests.filter((request) => {
          return (
            request.issue_title.toLowerCase().includes(query) ||
            request.apartment_name.toLowerCase().includes(query) ||
            request.tenant_name.toLowerCase().includes(query)
          );
        })
      : requests;

    return [...matches].sort((a, b) => {
      const statusDiff = STATUS_ORDER[a.status] - STATUS_ORDER[b.status];
      if (statusDiff !== 0) return statusDiff;
      return (
        new Date(b.reported_at).getTime() - new Date(a.reported_at).getTime()
      );
    });
  }, [requests, searchQuery]);

  const handleRequestPress = (requestId: string) => {
    router.push(`/landlord/maintenance-requests/${requestId}`);
  };

  return (
    <ScreenWrapper
      header={<StandardHeader title="Maintenance Requests" />}
      backgroundColor={COLORS.light.surface}
      scrollable={false}
    >
      <FlatList
        data={filteredRequests}
        keyExtractor={(item) => item.id}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
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

            <Text className="text-grey-500 text-sm font-inter mb-3">
              Total: {filteredRequests.length}
            </Text>
          </View>
        }
        ItemSeparatorComponent={() => <View className="h-3" />}
        ListEmptyComponent={<EmptyMaintenanceRequests />}
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
