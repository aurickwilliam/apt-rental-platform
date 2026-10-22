import { useEffect } from "react";
import { View, Text, Image } from "react-native";
import { useRouter } from "expo-router";

import { IMAGES } from "@/constants/images";

import { IconCalendarCheck, IconChartBar } from "@tabler/icons-react-native";

import { formatPesoDisplay } from "@repo/utils";

import ScreenWrapper from "@/components/layout/ScreenWrapper";
import RentDueCard from "@/app/(tabs)/components/dashboard/RentDueCard";
import MonthCollectionCard from "@/app/(tabs)/components/dashboard/MonthCollectionCard";
import DashboardStatTile from "@/app/(tabs)/components/dashboard/DashboardStatTile";
import NewRequestsCard from "@/app/(tabs)/components/dashboard/NewRequestsCard";
import ProfitTrendCard from "./../components/dashboard/ProfitTrendCard";
import CollectionHistoryCard from "./../components/dashboard/CollectionHistoryCard";
import DashboardSkeleton from "./../components/dashboard/DashboardSkeleton";
import EmptyProperties from "./../components/units/EmptyProperties";
import EmptyState from "@/components/display/EmptyState";
import NotificationBellButton from "@/app/(tabs)/components/NotificationBellButton";

import { useDashboardData } from "@/hooks/dashboard";
import { useColors } from "@/hooks/useTheme";

import {
  buildRequestItems,
  type RequestItem,
} from "@/service/dashboard/dashboardService";

import {
  FLOATING_TAB_BAR_HEIGHT,
  FLOATING_TAB_BAR_BOTTOM_OFFSET,
} from "@/app/(tabs)/components/CustomTabBar";

export default function Dashboard() {
  const router = useRouter();
  const { colors } = useColors();
  const { data, isLoading, error } = useDashboardData();
  const { stats, attention, thisMonth, collectionByMonth, monthlyRevenue, rentDues } =
    data;

  useEffect(() => {
    if (error) {
      console.error("Error fetching dashboard data:", error);
    }
  }, [error]);

  const totalDue = rentDues.reduce((sum, rent) => sum + rent.amount, 0);
  const hasAnyRevenue = monthlyRevenue.some((point) => point.amount > 0);
  const showCombinedChartEmpty = !hasAnyRevenue;
  const requestItems = buildRequestItems(attention);

  const openCashPayments = attention.pendingCashApartmentId
    ? () =>
        router.push(
          `/landlord/manage-apartment/${attention.pendingCashApartmentId}/payment-history`,
        )
    : undefined;

  const openRequest = (item: RequestItem) =>
    router.push(
      item.key === "applications"
        ? "/landlord/tenant-applications"
        : "/landlord/visit-requests",
    );

  return (
    <ScreenWrapper
      scrollable
      className="p-5"
      bottomPadding={FLOATING_TAB_BAR_HEIGHT + FLOATING_TAB_BAR_BOTTOM_OFFSET}
    >
      <View className="flex-row items-center justify-between mb-5">
        <View className="flex-row gap-3 items-center">
          <Image source={IMAGES.logo} className="size-9" resizeMode="contain" />

          <Text className="text-foreground text-3xl font-nunitoBold mt-1">
            Dashboard
          </Text>
        </View>

        <NotificationBellButton route="/landlord-notif" />
      </View>

      {isLoading ? (
        <DashboardSkeleton />
      ) : stats.totalProperties === 0 ? (
        <EmptyProperties
          onAdd={() => router.push("/landlord/manage-apartment/add-apartment/")}
        />
      ) : (
        <>
          <View className="flex gap-3">
            <MonthCollectionCard thisMonth={thisMonth} />

            <View className="flex-row gap-3">
              <DashboardStatTile
                label="Overdue"
                value={formatPesoDisplay(attention.overdueAmount)}
                caption={
                  attention.overdueCount === 0
                    ? "Nothing overdue"
                    : `${attention.overdueCount} ${attention.overdueCount === 1 ? "payment" : "payments"}`
                }
                isAlert={attention.overdueCount > 0}
              />
              <DashboardStatTile
                label="Cash to confirm"
                value={String(attention.pendingCashCount)}
                caption={
                  attention.pendingCashCount === 0
                    ? "All confirmed"
                    : formatPesoDisplay(attention.pendingCashAmount)
                }
                onPress={attention.pendingCashCount > 0 ? openCashPayments : undefined}
              />
            </View>

            <View className="flex-row gap-3">
              <DashboardStatTile
                label="Open maintenance"
                value={String(stats.maintenanceRequests)}
                caption={stats.maintenanceRequests === 0 ? "All clear" : "Requests to handle"}
                onPress={
                  stats.maintenanceRequests > 0
                    ? () => router.push("/landlord/maintenance-requests")
                    : undefined
                }
              />
              <DashboardStatTile
                label="Occupancy"
                value={`${stats.unitsOccupied}/${stats.totalProperties}`}
                caption={stats.totalProperties === 1 ? "unit occupied" : "units occupied"}
              />
            </View>

            {requestItems.length > 0 ? (
              <NewRequestsCard items={requestItems} onPressItem={openRequest} />
            ) : null}
          </View>

          <View className="flex gap-5 mt-5">
            {showCombinedChartEmpty ? (
              <View className="bg-surface rounded-3xl border border-border p-4">
                <EmptyState
                  icon={<IconChartBar size={36} color={colors.gray500} />}
                  title="No earnings yet"
                  description="Once tenants start paying rent, your earnings will show up here."
                />
              </View>
            ) : (
              <ProfitTrendCard monthlyRevenue={monthlyRevenue} />
            )}
            <CollectionHistoryCard collectionByMonth={collectionByMonth} />
          </View>

          <View className="flex gap-5 mt-5">
            <View className="flex-row items-center justify-between">
              <Text className="text-foreground text-lg font-nunitoSemiBold">
                Upcoming Rent Due
              </Text>
              <View className="bg-primary rounded-full px-3 py-1">
                <Text className="text-white font-nunitoSemiBold">
                  {formatPesoDisplay(totalDue)}
                </Text>
              </View>
            </View>

            {rentDues.length === 0 ? (
              <EmptyState
                icon={<IconCalendarCheck size={36} color={colors.gray500} />}
                title="No upcoming rent dues"
                description="You're all caught up. New dues will appear here as they come due."
              />
            ) : (
              <View className="flex gap-3">
                {rentDues.map((rent) => (
                  <RentDueCard
                    key={rent.id}
                    tenantName={rent.tenantName}
                    propertyName={rent.apartmentName}
                    dueDate={rent.dueDate}
                    amount={rent.amount}
                    isOverdue={rent.isOverdue}
                    onPress={() =>
                      router.push(
                        `/landlord/manage-apartment/${rent.apartmentId}`,
                      )
                    }
                  />
                ))}
              </View>
            )}
          </View>
        </>
      )}
    </ScreenWrapper>
  );
}
