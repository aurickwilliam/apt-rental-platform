import { useMemo, useState } from "react";
import { FlatList, Text, View } from "react-native";
import { useRouter } from "expo-router";

import { IconCalendarEvent } from "@tabler/icons-react-native";

import { SearchField } from "heroui-native";

import ScreenWrapper from "@/components/layout/ScreenWrapper";
import StandardHeader from "@/components/layout/StandardHeader";
import VisitRequestCard from "@/components/cards/VisitRequestCard";

import { COLORS } from "@repo/constants";
import { formatDate } from "@repo/utils";

import { VISIT_REQUESTS } from "./mockData";

function EmptyPending() {
  return (
    <View className="flex-1 items-center justify-center py-20">
      <View className="bg-white rounded-full p-5 mb-4">
        <IconCalendarEvent size={30} color={COLORS.grey} />
      </View>
      <Text className="text-text text-lg font-interSemiBold">
        No pending requests
      </Text>
      <Text className="text-grey-500 text-sm font-inter text-center mt-1">
        Pending visit requests will show up here.
      </Text>
    </View>
  );
}

export default function PendingVisitRequests() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");

  const pendingRequests = useMemo(() => {
    return VISIT_REQUESTS.filter((request) => request.status === "Pending");
  }, []);

  const filteredPending = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return pendingRequests;

    return pendingRequests.filter((request) => {
      return (
        request.tenant_name.toLowerCase().includes(query) ||
        request.apartment_name.toLowerCase().includes(query)
      );
    });
  }, [pendingRequests, searchQuery]);

  const handleRequestPress = (requestId: string) => {
    router.push(`/landlord/visit-requests/${requestId}`);
  };

  return (
    <ScreenWrapper
      header={<StandardHeader title="Pending Visit Requests" />}
      backgroundColor={COLORS.darkerWhite}
      scrollable={false}
    >
      <FlatList
        data={filteredPending}
        keyExtractor={(item) => item.id}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingTop: 16,
          paddingBottom: 30,
          flexGrow: filteredPending.length === 0 ? 1 : 0,
        }}
        ListHeaderComponent={
          <View className="gap-4">
            <SearchField value={searchQuery} onChange={setSearchQuery}>
              <SearchField.Group>
                <SearchField.SearchIcon />
                <SearchField.Input placeholder="Search tenant or apartment..." />
                <SearchField.ClearButton />
              </SearchField.Group>
            </SearchField>

            <Text className="text-grey-500 text-sm font-inter mb-3">
              Total: {filteredPending.length}
            </Text>
          </View>
        }
        ItemSeparatorComponent={() => <View className="h-3" />}
        ListEmptyComponent={<EmptyPending />}
        renderItem={({ item }) => (
          <VisitRequestCard
            tenantName={item.tenant_name}
            apartmentName={item.apartment_name}
            visitSchedule={`${formatDate(item.visit_date, "medium")} • ${
              item.visit_time
            }`}
            status={item.status}
            avatarUrl={item.tenant_avatar_url ?? undefined}
            onPress={() => handleRequestPress(item.id)}
          />
        )}
      />
    </ScreenWrapper>
  );
}
