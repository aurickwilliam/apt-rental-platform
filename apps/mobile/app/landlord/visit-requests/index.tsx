import { useCallback, useMemo, useState } from "react";
import { FlatList, Pressable, RefreshControl, Text, View } from "react-native";
import { useRouter } from "expo-router";

import { ChevronDown, ChevronUp } from "lucide-react-native";

import { Card, SearchField } from "heroui-native";

import ScreenWrapper from "@/components/layout/ScreenWrapper";
import StandardHeader from "@/components/layout/StandardHeader";
import VisitRequestCard from "./components/VisitRequestCard";
import VisitRequestCalendar from "./components/VisitRequestCalendar";
import EmptyApproved from "./components/EmptyApproved";
import VisitRequestCardSkeleton from "./components/VisitRequestCardSkeleton";

import { formatDate, formatFullName } from "@repo/utils";
import { useColors } from "@/hooks/useTheme";

import {
  useLandlordVisitRequests,
  type LandlordVisitRequest
} from "@/hooks/visitRequests";

type Group = "Today" | "This Week" | "Next Week" | "Later" | "Past";

type GroupedItem =
  | { type: "header"; group: Group; count: number }
  | { type: "item"; data: LandlordVisitRequest }
  | { type: "past-toggle" };

const getGroup = (dateStr: string, today: string, todayDate: Date): Group => {
  if (dateStr === today) return "Today";

  const date = new Date(dateStr);
  const diffDays = Math.floor(
    (date.getTime() - todayDate.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (diffDays < 0) return "Past";
  if (diffDays <= 7) return "This Week";
  if (diffDays <= 14) return "Next Week";
  return "Later";
};

const GROUP_ORDER: Group[] = ["Today", "This Week", "Next Week", "Later", "Past"];

function SectionHeader({ group, count }: { group: string; count: number }) {
  return (
    <View className="flex-row items-center gap-2 mb-3 mt-1">
      <Text className="text-foreground text-sm font-interSemiBold">
        {group}
      </Text>
      <View className="bg-surface-tertiary rounded-full px-2 py-0.5">
        <Text className="text-gray-700 text-xs font-interMedium">
          {count}
        </Text>
      </View>
    </View>
  );
}

function PastToggle({
  isExpanded,
  count,
  onToggle,
}: {
  isExpanded: boolean;
  count: number;
  onToggle: () => void;
}) {
  const { colors } = useColors();
  return (
    <Pressable
      onPress={onToggle}
      className="flex-row items-center justify-between py-3 mb-1"
    >
      <View className="flex-row items-center gap-2">
        <Text className="text-foreground text-sm font-interSemiBold">
          Past
        </Text>
        <View className="bg-surface-tertiary rounded-full px-2 py-0.5">
          <Text className="text-gray-700 text-xs font-interMedium">
            {count}
          </Text>
        </View>
      </View>
      {isExpanded ? (
        <ChevronUp size={20} color={colors.gray500} />
      ) : (
        <ChevronDown size={20} color={colors.gray500} />
      )}
    </Pressable>
  );
}

export default function VisitRequests() {
  const router = useRouter();
  const { colors } = useColors();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [isPastExpanded, setIsPastExpanded] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const { visitRequests, refetch, loading } = useLandlordVisitRequests();

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await refetch();
    setIsRefreshing(false);
  }, [refetch]);

  const todayStr = useMemo(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  }, []);

  const todayDate = useMemo(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
  }, []);

  const markedDates = useMemo(() => {
    return visitRequests
      .filter((r) => r.status === "approved")
      .map((r) => r.resolved_visit_date);
  }, [visitRequests]);

  const pendingCount = useMemo(() => {
    return visitRequests.filter((r) => r.status === "pending").length;
  }, [visitRequests]);

  const approvedRequests = useMemo(() => {
    return visitRequests.filter((r) => r.status === "approved");
  }, [visitRequests]);

  const filteredApproved = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return approvedRequests.filter((request) => {
      const tenantName = formatFullName({
        first_name: request.tenant.first_name,
        last_name: request.tenant.last_name,
      }).toLowerCase();
      const matchesSearch =
        !query ||
        tenantName.includes(query) ||
        request.apartment.name.toLowerCase().includes(query);
      const matchesDate = !selectedDate || request.resolved_visit_date === selectedDate;
      return matchesSearch && matchesDate;
    });
  }, [approvedRequests, searchQuery, selectedDate]);

  const groupedItems = useMemo((): GroupedItem[] => {
    // Bucket requests into groups
    const buckets = new Map<Group, typeof approvedRequests>();
    GROUP_ORDER.forEach((g) => buckets.set(g, []));

    filteredApproved.forEach((r) => {
      const group = getGroup(r.resolved_visit_date, todayStr, todayDate);
      buckets.get(group)!.push(r);
    });

    const items: GroupedItem[] = [];

    GROUP_ORDER.forEach((group) => {
      const requests = buckets.get(group)!;
      if (requests.length === 0) return;

      if (group === "Past") {
        // Always show the toggle row
        items.push({ type: "past-toggle" });
        if (isPastExpanded) {
          requests.forEach((r) => items.push({ type: "item", data: r }));
        }
        return;
      }

      items.push({ type: "header", group, count: requests.length });
      requests.forEach((r) => items.push({ type: "item", data: r }));
    });

    return items;
  }, [filteredApproved, todayStr, todayDate, isPastExpanded]);

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
        data={groupedItems}
        keyExtractor={(item, index) =>
          item.type === "item" ? item.data.id : `${item.type}-${index}`
        }
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingTop: 16,
          paddingBottom: 30,
          flexGrow: filteredApproved.length === 0 ? 1 : 0,
        }}
        refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          }
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
                {(searchQuery || selectedDate) && (
                  <Text className="text-gray-500 text-xs font-inter">
                    {filteredApproved.length} result{filteredApproved.length !== 1 ? "s" : ""}
                  </Text>
                )}
              </View>

              <SearchField value={searchQuery} onChange={setSearchQuery}>
                <SearchField.Group>
                  <SearchField.SearchIcon />
                  <SearchField.Input placeholder="Search tenant or apartment..." />
                  <SearchField.ClearButton />
                </SearchField.Group>
              </SearchField>

              {/* Skeletons shown inline while loading */}
              {loading && (
                <View className="gap-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <VisitRequestCardSkeleton key={i} />
                  ))}
                </View>
              )}
            </View>
          </View>
        }
        ItemSeparatorComponent={() => null}
        ListEmptyComponent={loading ? null : <EmptyApproved />}
        renderItem={({ item }) => {
          if (item.type === "header") {
            return <SectionHeader group={item.group} count={item.count} />;
          }

          if (item.type === "past-toggle") {
            const pastCount = filteredApproved.filter(
              (r) => getGroup(r.resolved_visit_date, todayStr, todayDate) === "Past"
            ).length;
            return (
              <PastToggle
                isExpanded={isPastExpanded}
                count={pastCount}
                onToggle={() => setIsPastExpanded((prev) => !prev)}
              />
            );
          }

          return (
            <View className="mb-3">
              <VisitRequestCard
                tenantName={formatFullName({
                  first_name: item.data.tenant.first_name,
                  last_name: item.data.tenant.last_name,
                })}
                apartmentName={item.data.apartment.name}
                visitSchedule={`${formatDate(item.data.resolved_visit_date, "medium")} at ${item.data.resolved_visit_time}`}
                status={item.data.status}
                avatarUrl={item.data.tenant.avatar_url ?? undefined}
                onPress={() => handleRequestPress(item.data.id)}
              />
            </View>
          );
        }}
      />
    </ScreenWrapper>
  );
}
