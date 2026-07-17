import { View, Text, ScrollView } from "react-native";

import {
  IconTrendingUp,
  IconCurrencyDollar,
  IconHome,
  IconUsers,
} from "@tabler/icons-react-native";

import StandardHeader from "@/components/layout/StandardHeader";
import ScreenWrapper from "@/components/layout/ScreenWrapper";

import { useColors } from "@/hooks/useTheme";

const stats = [
  {
    id: 1,
    label: "Total Revenue",
    value: "₱ 120,000",
    sub: "This month",
    icon: IconCurrencyDollar,
  },
  {
    id: 2,
    label: "Active Units",
    value: "8",
    sub: "Out of 10 listed",
    icon: IconHome,
  },
  {
    id: 3,
    label: "Active Tenants",
    value: "8",
    sub: "Currently renting",
    icon: IconUsers,
  },
  {
    id: 4,
    label: "Growth",
    value: "+12%",
    sub: "vs last month",
    icon: IconTrendingUp,
  },
];

const monthlyData = [
  { month: "Jan", amount: 80000 },
  { month: "Feb", amount: 95000 },
  { month: "Mar", amount: 88000 },
  { month: "Apr", amount: 102000 },
  { month: "May", amount: 110000 },
  { month: "Jun", amount: 120000 },
];

const MAX_AMOUNT = Math.max(...monthlyData.map((d) => d.amount));

export default function AnalyticsScreen() {
  const {colors} = useColors();

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
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <View
                key={stat.id}
                className="bg-default-100 rounded-xl p-4 flex-1 min-w-[44%]"
              >
                <View className="w-9 h-9 rounded-full bg-primary/10 items-center justify-center mb-3">
                  <Icon size={18} color={colors.primary} />
                </View>
                <Text className="text-lg font-bold text-foreground">
                  {stat.value}
                </Text>
                <Text className="text-xs font-medium text-foreground mt-0.5">
                  {stat.label}
                </Text>
                <Text className="text-xs text-default-400 mt-0.5">
                  {stat.sub}
                </Text>
              </View>
            );
          })}
        </View>

        {/* Monthly Revenue Chart */}
        <View className="bg-default-100 rounded-xl p-4">
          <Text className="text-sm font-semibold text-foreground mb-1">
            Monthly Revenue
          </Text>
          <Text className="text-xs text-default-400 mb-4">
            Last 6 months overview
          </Text>

          {/* Simple Bar Chart */}
          <View className="flex-row items-end justify-between gap-2 h-32">
            {monthlyData.map((item) => {
              const heightPercent = (item.amount / MAX_AMOUNT) * 100;
              return (
                <View key={item.month} className="flex-1 items-center gap-1">
                  <View
                    style={{
                      height: `${heightPercent}%`,
                      backgroundColor: colors.primary,
                      borderRadius: 6,
                      width: "100%",
                      opacity: item.month === "Jun" ? 1 : 0.4,
                    }}
                  />
                  <Text className="text-xs text-default-400">{item.month}</Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* Payment Summary */}
        <View className="bg-default-100 rounded-xl p-4 gap-3">
          <Text className="text-sm font-semibold text-foreground">
            Payment Summary
          </Text>
          {[
            { label: "Collected", value: "₱ 96,000", color: colors.success },
            { label: "Pending", value: "₱ 20,000", color: colors.warning },
            { label: "Overdue", value: "₱ 4,000", color: colors.danger },
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
                <Text className="text-sm text-default-500">{item.label}</Text>
              </View>
              <Text className="text-sm font-semibold text-foreground">
                {item.value}
              </Text>
            </View>
          ))}
        </View>

        {/* Top Performing Unit */}
        <View className="bg-default-100 rounded-xl p-4 gap-3">
          <Text className="text-sm font-semibold text-foreground">
            Top Performing Units
          </Text>
          {[
            { unit: "Unit 3A - Quezon City", revenue: "₱ 18,000" },
            { unit: "Unit 1B - Caloocan", revenue: "₱ 15,000" },
            { unit: "Unit 2C - Marikina", revenue: "₱ 12,000" },
          ].map((item, index) => (
            <View
              key={item.unit}
              className="flex-row justify-between items-center"
            >
              <View className="flex-row items-center gap-3">
                <Text className="text-xs font-bold text-default-400 w-4">
                  {index + 1}
                </Text>
                <Text className="text-sm text-foreground">{item.unit}</Text>
              </View>
              <Text className="text-sm font-semibold text-primary">
                {item.revenue}
              </Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </ScreenWrapper>
  );
}