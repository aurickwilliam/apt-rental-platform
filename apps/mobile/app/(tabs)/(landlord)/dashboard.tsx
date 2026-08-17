import { useEffect } from "react";
import { View, Text, Image, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";

import { IMAGES } from "@/constants/images";

import { IconBell, IconChartBar } from "@tabler/icons-react-native";

import { formatPesoDisplay } from "@repo/utils";

import ScreenWrapper from "@/components/layout/ScreenWrapper";
import RentDueCard from "@/app/(tabs)/components/dashboard/RentDueCard";
import ProfitTrendCard from "./../components/dashboard/ProfitTrendCard";
import ProfitByPropertyCard from "./../components/dashboard/ProfitByPropertyCard";
import EmptyProperties from "./../components/units/EmptyProperties";
import EmptyState from "@/components/display/EmptyState";

import { useDashboardStats, useMonthlyRevenue, useRentDues } from "@/hooks/dashboard";
import { useColors } from "@/hooks/useTheme";

import { Button } from "heroui-native";

import {
  FLOATING_TAB_BAR_HEIGHT,
  FLOATING_TAB_BAR_BOTTOM_OFFSET,
} from "@/app/(tabs)/components/CustomTabBar";

export default function Dashboard() {
  const router = useRouter();
  const { colors } = useColors();
  const { stats, loading, error } = useDashboardStats();
  const { data: rentDues = [], isLoading: rentDuesLoading } = useRentDues();
  const { data: monthlyRevenue = [], isLoading: revenueLoading } = useMonthlyRevenue();

  useEffect(() => {
    if (error) {
      console.error("Error fetching dashboard stats:", error);
    }
  }, [error]);

  const totalDue = rentDues.reduce((sum, rent) => sum + rent.amount, 0);
  const hasAnyRevenue = monthlyRevenue.some((point) => point.amount > 0);
  const showCombinedChartEmpty = !revenueLoading && !hasAnyRevenue;

  return (
    <ScreenWrapper
      scrollable
      className="p-5"
      bottomPadding={FLOATING_TAB_BAR_HEIGHT + FLOATING_TAB_BAR_BOTTOM_OFFSET}
    >
      <View className="flex-row items-center justify-between mb-5">
        <View className="flex-row gap-3 items-center">
          <Image source={IMAGES.logo} className="size-9" resizeMode="contain" />
          <Text className="text-foreground text-3xl font-nunitoSemiBold mt-1">
            Dashboard
          </Text>
        </View>

        <Button
          onPress={() => router.push("/landlord-notif")}
          variant="ghost"
          isIconOnly
        >
          <IconBell size={26} color={colors.gray500} />
        </Button>
      </View>

      {loading ? (
        <ActivityIndicator
          size="large"
          color={colors.primary}
          className="my-6"
        />
      ) : stats.totalProperties === 0 ? (
        <EmptyProperties
          onAdd={() => router.push("/landlord/manage-apartment/add-apartment/")}
        />
      ) : (
        <>
          <View className="flex gap-3">
            <View className="flex-row gap-3">
              <View className="flex-1 bg-primary rounded-3xl p-4 gap-1 justify-center">
                <Text className="text-sm text-gray-100 font-interMedium">
                  Total Properties
                </Text>
                <Text className="text-3xl text-white font-interSemiBold">
                  {stats.totalProperties}
                </Text>
              </View>

              <View className="flex-1 bg-surface rounded-3xl p-4 gap-1 border border-border justify-center">
                <Text className="text-sm text-muted font-interMedium">
                  Units Occupied
                </Text>
                <Text className="text-3xl text-foreground font-interSemiBold">
                  {stats.unitsOccupied}/{stats.totalProperties}
                </Text>
              </View>
            </View>

            <View className="flex-row gap-3">
              <View className="flex-1 bg-surface rounded-3xl p-4 gap-1 border border-border justify-center">
                <Text className="text-sm text-muted font-interMedium">
                  Pending Payments
                </Text>
                <Text className="text-3xl text-foreground font-interSemiBold">
                  {stats.pendingPayments}
                </Text>
              </View>

              <View className="flex-1 bg-surface rounded-3xl p-4 gap-1 border border-border justify-center">
                <Text className="text-sm text-muted font-interMedium">
                  Maintenance Requests
                </Text>
                <Text className="text-3xl text-foreground font-interSemiBold">
                  {stats.maintenanceRequests}
                </Text>
              </View>
            </View>
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
              <>
                <ProfitTrendCard />
                <ProfitByPropertyCard />
              </>
            )}
          </View>

          <View className="flex gap-5 mt-5">
            <View className="flex-row items-center justify-between">
              <Text className="text-foreground text-lg font-interSemiBold">
                Upcoming Rent Due
              </Text>
              <View className="bg-primary rounded-full px-3 py-1">
                <Text className="text-white font-interSemiBold">
                  {formatPesoDisplay(totalDue)}
                </Text>
              </View>
            </View>

            {rentDuesLoading ? (
              <ActivityIndicator size="large" color={colors.primary} className="my-6" />
            ) : rentDues.length === 0 ? (
              <View className="items-center py-10 gap-2">
                <Text className="text-gray-400 font-interSemiBold">
                  No upcoming rent dues
                </Text>
                <Text className="text-gray-400 text-sm font-inter text-center px-8">
                  You&apos;re all caught up, new dues will appear here as they come due.
                </Text>
              </View>
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
                      router.push(`/landlord/manage-apartment/${rent.apartmentId}`)
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
