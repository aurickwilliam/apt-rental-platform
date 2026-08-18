import { View, Text } from "react-native";
import { useState } from "react";
import { BarChart } from "react-native-gifted-charts";
import { IconChartBar } from "@tabler/icons-react-native";

import DropdownButton from "@/components/buttons/DropdownButton";
import EmptyState from "@/components/display/EmptyState";

import { MONTHS } from "@repo/constants";

import { useColors } from "@/hooks/useTheme";

import type { PropertyRevenue } from "@/service/dashboard/dashboardService";

interface ProfitByPropertyCardProps {
  revenueByProperty: PropertyRevenue[];
}

function chartLabel(name: string): string {
  const words = name.split(" ");
  if (words.length > 1) {
    const first = words[0];
    const rest = words.slice(1).join(" ");
    const truncatedRest = rest.length > 10 ? `${rest.slice(0, 9)}…` : rest;
    return `${first}\n${truncatedRest}`;
  }
  return name.length > 12 ? `${name.slice(0, 11)}…` : name;
}

export default function ProfitByPropertyCard({
  revenueByProperty,
}: ProfitByPropertyCardProps) {
  const { colors } = useColors();

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonthIndex = now.getMonth();

  const [selectedMonth, setSelectedMonth] = useState(MONTHS[currentMonthIndex]);

  const monthIndex = MONTHS.indexOf(selectedMonth);
  const year = monthIndex > currentMonthIndex ? currentYear - 1 : currentYear;
  const monthKey = `${year}-${String(monthIndex + 1).padStart(2, "0")}`;

  const chartData = revenueByProperty
    .map((entry) => ({
      value: entry.months.find((month) => month.month === monthKey)?.amount ?? 0,
      label: chartLabel(entry.apartmentName),
      frontColor: colors.primary,
    }))
    .filter((datum) => datum.value > 0);

  const maxValue = chartData.reduce((max, datum) => Math.max(max, datum.value), 0);

  return (
    <View className="w-full border border-border p-4 rounded-3xl bg-surface">
      {/* HEADER */}
      <View className="flex-row items-center justify-between">
        <View className="flex">
          <Text className="text-accent font-interSemiBold text-xl">
            Profit by Property
          </Text>
        </View>

        <DropdownButton
          label="Select Month"
          options={MONTHS}
          value={selectedMonth}
          onSelect={setSelectedMonth}
        />
      </View>

      {/* CHART */}
      <View className="mt-4 overflow-hidden">
        {chartData.length === 0 ? (
          <EmptyState
            icon={<IconChartBar size={36} color={colors.gray500} />}
            title="No earnings this month"
            description="Try another month — collections appear here once tenants pay."
          />
        ) : (
          <BarChart
            data={chartData}
            height={180}
            barWidth={42}
            barBorderRadius={6}
            spacing={14}
            maxValue={maxValue + 1500}
            noOfSections={4}
            yAxisColor="transparent"
            xAxisColor="#e5e7eb"
            rulesColor="#f3f4f6"
            rulesType="solid"
            yAxisTextStyle={{ color: "#9ca3af", fontSize: 10, fontFamily: "Inter" }}
            xAxisLabelTextStyle={{
              color: colors.textPrimary,
              fontSize: 9,
              fontFamily: "Inter",
              textAlign: "center",
            }}
            formatYLabel={(val) => `₱${Number(val) / 1000}k`}
            showValuesAsTopLabel
            topLabelTextStyle={{
              color: colors.gray500,
              fontSize: 9,
              fontWeight: "600",
              fontFamily: "Inter",
            }}
            topLabelContainerStyle={{ paddingBottom: 4 }}
            renderTooltip={(item: any) => (
              <View
                style={{
                  backgroundColor: item.frontColor,
                  borderRadius: 6,
                  paddingHorizontal: 6,
                  paddingVertical: 3,
                  marginBottom: 4,
                }}
              >
                <Text style={{ color: "white", fontSize: 10, fontWeight: "600" }}>
                  ₱{item.value.toLocaleString()}
                </Text>
              </View>
            )}
          />
        )}
      </View>
    </View>
  );
}
