import { useMemo, useState } from "react";
import { FlatList, Text, View } from "react-native";
import { useRouter } from "expo-router";

import { House } from "lucide-react-native";

import { Card, SearchField } from "heroui-native";

import ScreenWrapper from "@/components/layout/ScreenWrapper";
import StandardHeader from "@/components/layout/StandardHeader";
import VisitRequestCard from "@/components/cards/VisitRequestCard";
import VisitRequestCalendar from "./components/VisitRequestCalendar";

import { formatDate } from "@repo/utils";
import { useColors } from "@/hooks/useTheme";

import { VISIT_REQUESTS } from "./mockData";

function EmptyApproved() {
  const { colors } = useColors();
  return (
    <View className="flex-1 items-center justify-center py-12">
      <View className="bg-white rounded-full p-5 mb-4">
        <House size={28} color={colors.gray500} />
      </View>
      <Text className="text-foreground text-lg font-interSemiBold">
        No approved visits
      </Text>
      <Text className="text-muted text-sm font-inter text-center mt-1">
        Approved visit requests will appear here.
      </Text>
    </View>
  );
}

export default function VisitRequests() {
  const router = useRouter();
  const { colors } = useColors();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const markedDates = useMemo(() => {
    return VISIT_REQUESTS.filter((r) => r.status === "Approved").map(
      (r) => r.visit_date
    );
  }, []);

  const pendingCount = useMemo(() => {
    return VISIT_REQUESTS.filter((r) => r.status === "Pending").length;
  }, []);

  const approvedRequests = useMemo(() => {
    return VISIT_REQUESTS.filter((r) => r.status === "Approved");
  }, []);

  const filteredApproved = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return approvedRequests.filter((request) => {
      const matchesSearch =
        !query ||
        request.tenant_name.toLowerCase().includes(query) ||
        request.apartment_name.toLowerCase().includes(query);
      const matchesDate =
        !selectedDate || request.visit_date === selectedDate;
      return matchesSearch && matchesDate;
    });
  }, [approvedRequests, searchQuery, selectedDate]);

  const handlePendingPress = () => {
    router.push("/landlord/visit-requests/pending");
  };

  const handleRequestPress = (requestId: string) => {
    router.push(`/landlord/visit-requests/${requestId}`);
  };

  return (
    <ScreenWrapper
      header={<StandardHeader title="Visit Requests" />}
      scrollable={false}
    >
      <FlatList
        data={filteredApproved}
        keyExtractor={(item) => item.id}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingTop: 16,
          paddingBottom: 30,
          flexGrow: filteredApproved.length === 0 ? 1 : 0,
        }}
        ListHeaderComponent={
          <View className="gap-5">
            <Card className="shadow-none border border-border p-3 rounded-3xl">
              <Card.Body>
                <VisitRequestCalendar
                  markedDates={markedDates}
                  selectedDate={selectedDate}
                  onSelectDate={setSelectedDate}
                  pendingCount={pendingCount}
                  onPendingPress={handlePendingPress}
                />
              </Card.Body>
            </Card>

            <View className="gap-3 mb-3">
              <View className="flex-row items-center justify-between">
                <Text className="text-foreground text-base font-interSemiBold">
                  Approved Visit Requests
                </Text>
                <Text className="text-gray-500 text-xs font-inter">
                  Total: {filteredApproved.length}
                </Text>
              </View>

              <SearchField value={searchQuery} onChange={setSearchQuery}>
                <SearchField.Group>
                  <SearchField.SearchIcon />
                  <SearchField.Input placeholder="Search tenant or apartment..." />
                  <SearchField.ClearButton />
                </SearchField.Group>
              </SearchField>
            </View>
          </View>
        }
        ItemSeparatorComponent={() => <View className="h-3" />}
        ListEmptyComponent={<EmptyApproved />}
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
