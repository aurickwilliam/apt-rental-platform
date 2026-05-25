import { useMemo, useState } from "react";
import { FlatList, Pressable, Text, View } from "react-native";
import { useRouter } from "expo-router";

import {
  IconChevronLeft,
  IconChevronRight,
  IconHome,
} from "@tabler/icons-react-native";

import { Button, Card, SearchField } from "heroui-native";

import ScreenWrapper from "@/components/layout/ScreenWrapper";
import StandardHeader from "@/components/layout/StandardHeader";
import VisitRequestCard from "@/components/cards/VisitRequestCard";

import { COLORS } from "@repo/constants";
import { formatDate } from "@repo/utils";

import { VISIT_REQUESTS } from "./mockData";

const DAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

const formatDateKey = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const normalizeDate = (date: Date) =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate());

const buildMonthCells = (monthDate: Date) => {
  const year = monthDate.getFullYear();
  const month = monthDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const startIndex = firstDay.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells: Array<Date | null> = Array.from({ length: 42 }, () => null);
  for (let i = 0; i < daysInMonth; i += 1) {
    cells[startIndex + i] = new Date(year, month, i + 1);
  }

  return cells;
};

const formatMonthLabel = (date: Date) =>
  date.toLocaleDateString("en-US", { month: "long", year: "numeric" });

function EmptyApproved() {
  return (
    <View className="flex-1 items-center justify-center py-12">
      <View className="bg-white rounded-full p-5 mb-4">
        <IconHome size={28} color={COLORS.grey} />
      </View>
      <Text className="text-text text-lg font-interSemiBold">
        No approved visits
      </Text>
      <Text className="text-grey-500 text-sm font-inter text-center mt-1">
        Approved visit requests will appear here.
      </Text>
    </View>
  );
}

export default function VisitRequests() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [currentMonth, setCurrentMonth] = useState(() =>
    new Date(new Date().getFullYear(), new Date().getMonth(), 1)
  );
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());

  const requestDateSet = useMemo(() => {
    return new Set(VISIT_REQUESTS.map((request) => request.visit_date));
  }, []);

  const pendingCount = useMemo(() => {
    return VISIT_REQUESTS.filter((request) => request.status === "Pending")
      .length;
  }, []);

  const approvedRequests = useMemo(() => {
    return VISIT_REQUESTS.filter((request) => request.status === "Approved");
  }, []);

  const filteredApproved = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return approvedRequests;
    return approvedRequests.filter((request) => {
      return (
        request.tenant_name.toLowerCase().includes(query) ||
        request.apartment_name.toLowerCase().includes(query)
      );
    });
  }, [approvedRequests, searchQuery]);

  const monthCells = useMemo(
    () => buildMonthCells(currentMonth),
    [currentMonth]
  );

  const today = normalizeDate(new Date());
  const todayKey = formatDateKey(today);
  const selectedKey = selectedDate ? formatDateKey(selectedDate) : "";

  const handlePendingPress = () => {
    router.push("/landlord/visit-requests/pending");
  };

  const handleRequestPress = (requestId: string) => {
    router.push(`/landlord/visit-requests/${requestId}`);
  };

  const handleChangeMonth = (offset: number) => {
    setCurrentMonth((prev) =>
      new Date(prev.getFullYear(), prev.getMonth() + offset, 1)
    );
  };

  return (
    <ScreenWrapper
      header={<StandardHeader title="Visit Requests" />}
      backgroundColor={COLORS.darkerWhite}
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
            <View className="gap-2">
              <Text className="text-primary text-base font-interMedium">
                Visit Request Schedule
              </Text>
              <Card className="shadow-none border border-grey-200">
                <Card.Body className="p-4 gap-4">
                  <View className="flex-row items-center justify-between">
                    <Pressable
                      onPress={() => handleChangeMonth(-1)}
                      className="p-2 rounded-full"
                    >
                      <IconChevronLeft size={20} color={COLORS.grey} />
                    </Pressable>

                    <Text className="text-text text-base font-interSemiBold">
                      {formatMonthLabel(currentMonth)}
                    </Text>

                    <Pressable
                      onPress={() => handleChangeMonth(1)}
                      className="p-2 rounded-full"
                    >
                      <IconChevronRight size={20} color={COLORS.grey} />
                    </Pressable>
                  </View>

                  <View className="flex-row justify-between">
                    {DAYS.map((day) => (
                      <Text
                        key={day}
                        className="text-grey-500 text-xs font-inter"
                        style={{ width: 32, textAlign: "center" }}
                      >
                        {day}
                      </Text>
                    ))}
                  </View>

                  <View className="flex-row flex-wrap">
                    {monthCells.map((date, index) => {
                      if (!date) {
                        return (
                          <View
                            key={`empty-${index}`}
                            style={{ width: 32, height: 40 }}
                          />
                        );
                      }

                      const dateKey = formatDateKey(date);
                      const isRequestDay = requestDateSet.has(dateKey);
                      const isSelected = dateKey === selectedKey;
                      const isToday = dateKey === todayKey;
                      const isPast = normalizeDate(date) < today;
                      const isAvailable = !isPast && !isRequestDay;

                      return (
                        <Pressable
                          key={dateKey}
                          onPress={() => setSelectedDate(date)}
                          className="items-center justify-center"
                          style={{ width: 32, height: 40 }}
                        >
                          <View
                            className="items-center justify-center rounded-full"
                            style={{
                              width: 28,
                              height: 28,
                              borderWidth: isSelected || isToday ? 1 : 0,
                              borderColor: isSelected
                                ? COLORS.primary
                                : isToday
                                ? COLORS.primary
                                : "transparent",
                              backgroundColor: isSelected
                                ? COLORS.primary
                                : "transparent",
                              opacity: isPast ? 0.4 : 1,
                            }}
                          >
                            <Text
                              className="text-xs font-inter"
                              style={{
                                color: isSelected
                                  ? COLORS.white
                                  : isRequestDay
                                  ? COLORS.primary
                                  : isAvailable
                                  ? COLORS.text
                                  : COLORS.grey,
                              }}
                            >
                              {date.getDate()}
                            </Text>
                          </View>
                          <View className="mt-1">
                            {isRequestDay ? (
                              <View
                                style={{
                                  width: 6,
                                  height: 6,
                                  borderRadius: 999,
                                  backgroundColor: isSelected
                                    ? COLORS.white
                                    : COLORS.primary,
                                }}
                              />
                            ) : isAvailable ? (
                              <View
                                style={{
                                  width: 6,
                                  height: 6,
                                  borderRadius: 999,
                                  borderWidth: 1,
                                  borderColor: COLORS.lightGrey,
                                }}
                              />
                            ) : (
                              <View style={{ width: 6, height: 6 }} />
                            )}
                          </View>
                        </Pressable>
                      );
                    })}
                  </View>

                  <View className="flex-row items-center gap-4">
                    <View className="flex-row items-center gap-2">
                      <View
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: 999,
                          backgroundColor: COLORS.primary,
                        }}
                      />
                      <Text className="text-xs text-grey-500 font-inter">
                        Visit requests
                      </Text>
                    </View>
                    <View className="flex-row items-center gap-2">
                      <View
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: 999,
                          borderWidth: 1,
                          borderColor: COLORS.lightGrey,
                        }}
                      />
                      <Text className="text-xs text-grey-500 font-inter">
                        Available dates
                      </Text>
                    </View>
                  </View>
                </Card.Body>
              </Card>
            </View>

            <Button onPress={handlePendingPress} className="w-full">
              <Button.Label>
                Pending Visit Requests ({pendingCount})
              </Button.Label>
            </Button>

            <View className="gap-3 mb-3">
              <View className="flex-row items-center justify-between">
                <Text className="text-text text-base font-interSemiBold">
                  Approved Visit Requests
                </Text>
                <Text className="text-grey-500 text-xs font-inter">
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
