import { useMemo, useState } from "react";
import { FlatList, RefreshControl, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { ListFilter } from "lucide-react-native";
import { Button, SearchField } from "heroui-native";

import ScreenWrapper from "@/components/layout/ScreenWrapper";
import StandardHeader from "@/components/layout/StandardHeader";
import VisitRequestCard from "./components/VisitRequestCard";
import VisitRequestFilterSheet, {
  type VisitRequestFilters,
  type DateRange,
} from "./components/VisitRequestFilterSheet";
import VisitRequestCardSkeleton from "./components/VisitRequestCardSkeleton";
import EmptyPending from "./components/EmptyPending";

import { formatDate, formatFullName, formatTime } from "@repo/utils";
import { useColors } from "@/hooks/useTheme";
import { useLandlordVisitRequests } from "@/hooks/useLandlordVisitRequests";

const EMPTY_FILTERS: VisitRequestFilters = { statuses: [], dateRanges: [] };

const getDateRange = (dateStr: string, todayStr: string, todayDate: Date): DateRange => {
  if (dateStr === todayStr) return "Today";

  const date = new Date(dateStr);
  const diffDays = Math.floor(
    (date.getTime() - todayDate.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (diffDays < 0) return "Past";
  if (diffDays <= 7) return "This Week";

  const d = new Date(dateStr);
  const now = new Date(todayStr);
  if (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth()
  ) {
    return "This Month";
  }

  // Beyond this month — still bucket into This Month as the furthest range
  return "This Month";
};

export default function PendingVisitRequests() {
  const router = useRouter();
  const { colors } = useColors();

  const [searchQuery, setSearchQuery] = useState("");
  const [filterOpen, setFilterOpen] = useState(false);
  const [filters, setFilters] = useState<VisitRequestFilters>(EMPTY_FILTERS);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const { visitRequests, refetch, loading } = useLandlordVisitRequests();

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refetch();
    setIsRefreshing(false);
  };

  const todayStr = useMemo(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  }, []);

  const todayDate = useMemo(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
  }, []);

  const filteredRequests = useMemo(() => {
    let result = visitRequests.filter((r) => r.status !== "approved");

    const query = searchQuery.trim().toLowerCase();
    if (query) {
      result = result.filter((r) => {
        const tenantName = formatFullName({
          first_name: r.tenant.first_name,
          last_name: r.tenant.last_name,
        }).toLowerCase();
        return (
          tenantName.includes(query) ||
          r.apartment.name.toLowerCase().includes(query)
        );
      });
    }

    if (filters.statuses.length > 0) {
      result = result.filter((r) => filters.statuses.includes(r.status));
    }

    if (filters.dateRanges.length > 0) {
      result = result.filter((r) => {
        const range = getDateRange(r.visit_date, todayStr, todayDate);
        return filters.dateRanges.includes(range);
      });
    }

    return result;
  }, [visitRequests, searchQuery, filters, todayStr, todayDate]);

  const activeCount = filters.statuses.length + filters.dateRanges.length;

  const handleRequestPress = (requestId: string) => {
    router.push(`/landlord/visit-requests/${requestId}`);
  };

  return (
    <ScreenWrapper
      header={<StandardHeader title="Visit Requests" />}
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
          flexGrow: !loading && filteredRequests.length === 0 ? 1 : 0,
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
          <View className="gap-4">
            <View className="flex-row items-center gap-2">
              <View className="flex-1">
                <SearchField value={searchQuery} onChange={setSearchQuery}>
                  <SearchField.Group>
                    <SearchField.SearchIcon />
                    <SearchField.Input placeholder="Search tenant or apartment..." />
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

            {loading ? (
              <View className="gap-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <VisitRequestCardSkeleton key={i} />
                ))}
              </View>
            ) : (
              <Text className="text-gray-500 text-sm font-inter mb-3">
                Total: {filteredRequests.length}
              </Text>
            )}
          </View>
        }
        ItemSeparatorComponent={() => <View className="h-3" />}
        ListEmptyComponent={loading ? null : <EmptyPending />}
        renderItem={({ item }) => (
          <VisitRequestCard
            tenantName={formatFullName({
              first_name: item.tenant.first_name,
              last_name: item.tenant.last_name,
            })}
            apartmentName={item.apartment.name}
            visitSchedule={`${formatDate(item.visit_date, "medium")} at ${formatTime(item.time)}`}
            status={item.status}
            avatarUrl={item.tenant.avatar_url ?? undefined}
            onPress={() => handleRequestPress(item.id)}
          />
        )}
      />

      <VisitRequestFilterSheet
        isOpen={filterOpen}
        onOpenChange={setFilterOpen}
        filters={filters}
        onChange={setFilters}
      />
    </ScreenWrapper>
  );
}
