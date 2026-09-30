import { useEffect } from "react";
import { View, Text, ScrollView } from "react-native";
import { useRouter } from "expo-router";

import {
  IconCurrencyDollar,
  IconHome,
  IconClock,
  IconTool,
  IconChartBar,
} from "@tabler/icons-react-native";

import { formatPesoDisplay } from "@repo/utils";

import StandardHeader from "@/components/layout/StandardHeader";
import ScreenWrapper from "@/components/layout/ScreenWrapper";
import EmptyState from "@/components/display/EmptyState";
import DashboardSkeleton from "@/app/(tabs)/components/dashboard/DashboardSkeleton";
import EmptyProperties from "@/app/(tabs)/components/units/EmptyProperties";

import { useDashboardData } from "@/hooks/dashboard";
import {
  currentMonthKey,
  monthLabel,
  monthRevenueTotal,
  summarizeRentDues,
  topPropertiesByRevenue,
} from "@/service/dashboard/dashboardService";
import { useColors } from "@/hooks/useTheme";

export default function AnalyticsScreen() {
  const router = useRouter();
  const { colors } = useColors();
  const { data, isLoading, error } = useDashboardData();
  const { stats, monthlyRevenue, revenueByProperty, rentDues } = data;

  useEffect(() => {
    if (error) {
      console.error("Error fetching analytics data:", error);
    }
  }, [error]);

  if (isLoading) {
    return (
      <ScreenWrapper header={<StandardHeader title="Analytics" />} scrollable>
        <DashboardSkeleton />
      </ScreenWrapper>
    );
  }

  if (stats.totalProperties === 0) {
    return (
      <ScreenWrapper header={<StandardHeader title="Analytics" />} scrollable>
        <EmptyProperties
          onAdd={() => router.push("/landlord/manage-apartment/add-apartment/")}
        />
      </ScreenWrapper>
    );
  }

  const monthKey = currentMonthKey();
  const revenueThisMonth = monthRevenueTotal(monthlyRevenue, monthKey);
  const recentRevenue = monthlyRevenue.slice(-6);
  const maxAmount = Math.max(1, ...recentRevenue.map((d) => d.amount));
  const hasAnyRevenue = monthlyRevenue.some((point) => point.amount > 0);
  const { pendingTotal, overdueTotal } = summarizeRentDues(rentDues);
  const topUnits = topPropertiesByRevenue(revenueByProperty, 3);

  const statsCards = [
    {
      id: 1,
      label: "Total Revenue",
      value: formatPesoDisplay(revenueThisMonth),
      sub: "This month",
      icon: IconCurrencyDollar,
    },
    {
      id: 2,
      label: "Active Units",
      value: `${stats.unitsOccupied}`,
      sub: `Out of ${stats.totalProperties} listed`,
      icon: IconHome,
    },
    {
      id: 3,
      label: "Pending Payments",
      value: `${stats.pendingPayments}`,
      sub: "Awaiting collection",
      icon: IconClock,
    },
    {
      id: 4,
      label: "Maintenance Requests",
      value: `${stats.maintenanceRequests}`,
      sub: "Open requests",
      icon: IconTool,
    },
  ];

  return (
    <ScreenWrapper
      header={<StandardHeader title="Analytics" />}
      scrollable
    >

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerClassName="px-4 pt-4 pb-10 gap-4"
      >
        {/* Stat Cards */}
        <View className="flex-row flex-wrap gap-3">
          {statsCards.map((stat) => {
            const Icon = stat.icon;
            return (
              <View
                key={stat.id}
                className="bg-default rounded-xl p-4 flex-1 min-w-[44%]"
              >
                <View className="w-9 h-9 rounded-full bg-primary/10 items-center justify-center mb-3">
                  <Icon size={18} color={colors.primary} />
                </View>
                <Text className="text-lg font-nunitoBold text-foreground">
                  {stat.value}
                </Text>
                <Text className="text-xs font-nunitoSemiBold text-foreground mt-0.5">
                  {stat.label}
                </Text>
                <Text className="text-xs text-muted mt-0.5">
                  {stat.sub}
                </Text>
              </View>
            );
          })}
        </View>

        {/* Monthly Revenue Chart */}
        <View className="bg-default rounded-xl p-4">
          <Text className="text-sm font-nunitoSemiBold text-foreground mb-1">
            Monthly Revenue
          </Text>
          <Text className="text-xs text-muted mb-4">
            Last 6 months overview
          </Text>

          {!hasAnyRevenue ? (
            <EmptyState
              icon={<IconChartBar size={36} color={colors.gray500} />}
              title="No earnings yet"
              description="Once tenants start paying rent, your earnings will show up here."
            />
          ) : (
            <View className="flex-row items-end justify-between gap-2 h-32">
              {recentRevenue.map((item) => {
                const heightPercent = (item.amount / maxAmount) * 100;
                return (
                  <View key={item.month} className="flex-1 items-center gap-1">
                    <View
                      style={{
                        height: `${heightPercent}%`,
                        backgroundColor: colors.primary,
                        borderRadius: 6,
                        width: "100%",
                        opacity: item.month === monthKey ? 1 : 0.4,
                      }}
                    />
                    <Text className="text-xs text-muted">{monthLabel(item.month)}</Text>
                  </View>
                );
              })}
            </View>
          )}
        </View>

        {/* Payment Summary */}
        <View className="bg-default rounded-xl p-4 gap-3">
          <Text className="text-sm font-nunitoSemiBold text-foreground">
            Payment Summary
          </Text>
          {[
            { label: "Collected", value: formatPesoDisplay(revenueThisMonth), color: colors.success },
            { label: "Pending", value: formatPesoDisplay(pendingTotal), color: colors.warning },
            { label: "Overdue", value: formatPesoDisplay(overdueTotal), color: colors.danger },
          ].map((item) => (
            <View key={item.label} className="flex-row justify-between items-center">
              <View className="flex-row items-center gap-2">
                <View
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: 4,
                    backgroundColor: item.color,
                  }}
                />
                <Text className="text-sm text-muted">{item.label}</Text>
              </View>
              <Text className="text-sm font-nunitoSemiBold text-foreground">
                {item.value}
              </Text>
            </View>
          ))}
        </View>

        {/* Top Performing Unit */}
        <View className="bg-default rounded-xl p-4 gap-3">
          <Text className="text-sm font-nunitoSemiBold text-foreground">
            Top Performing Units
          </Text>
          {topUnits.length === 0 ? (
            <Text className="text-sm text-muted">
              No revenue recorded yet.
            </Text>
          ) : (
            topUnits.map((item, index) => (
              <View
                key={item.apartmentId}
                className="flex-row justify-between items-center"
              >
                <View className="flex-row items-center gap-3">
                  <Text className="text-xs font-nunitoBold text-muted w-4">
                    {index + 1}
                  </Text>
                  <Text className="text-sm text-foreground">{item.apartmentName}</Text>
                </View>
                <Text className="text-sm font-nunitoSemiBold text-primary">
                  {formatPesoDisplay(item.total)}
                </Text>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </ScreenWrapper>
  );
}
