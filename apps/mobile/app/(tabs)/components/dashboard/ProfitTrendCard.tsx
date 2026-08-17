import { View, Text, ActivityIndicator } from "react-native";
import { useState } from "react";
import { LineChart } from "react-native-gifted-charts";
import { IconChartLine } from "@tabler/icons-react-native";

import DropdownButton from "@/components/buttons/DropdownButton";
import EmptyState from "@/components/display/EmptyState";

import { useMonthlyRevenue } from "@/hooks/dashboard";
import { useColors } from "@/hooks/useTheme";

import type { MonthlyRevenuePoint } from "@/service/dashboard/dashboardService";

const filterOptions: FilterOption[] = ["Monthly", "Quarterly", "Yearly"];
type FilterOption = "Monthly" | "Quarterly" | "Yearly";

type ChartDatum = { value: number; label: string };

function monthDateIndexes(points: MonthlyRevenuePoint[]): { year: number; monthIndex: number }[] {
  const now = new Date();
  const total = points.length;
  return points.map((_, i) => {
    const date = new Date(now.getFullYear(), now.getMonth() - (total - 1 - i), 1);
    return { year: date.getFullYear(), monthIndex: date.getMonth() };
  });
}

function toMonthly(points: MonthlyRevenuePoint[]): ChartDatum[] {
  return points.map((point) => ({ value: point.amount, label: point.month }));
}

function toQuarterly(points: MonthlyRevenuePoint[]): ChartDatum[] {
  const totals = new Map<string, { value: number; label: string }>();
  monthDateIndexes(points).forEach(({ year, monthIndex }, i) => {
    const quarter = Math.floor(monthIndex / 3);
    const key = `${year}-${quarter}`;
    const current = totals.get(key);
    totals.set(key, {
      value: (current?.value ?? 0) + points[i].amount,
      label: `Q${quarter + 1}`,
    });
  });
  return [...totals.values()];
}

function toYearly(points: MonthlyRevenuePoint[]): ChartDatum[] {
  const totals = new Map<number, ChartDatum>();
  monthDateIndexes(points).forEach(({ year }, i) => {
    const current = totals.get(year);
    totals.set(year, {
      value: (current?.value ?? 0) + points[i].amount,
      label: String(year),
    });
  });
  return [...totals.values()];
}

const BUILDERS: Record<FilterOption, (points: MonthlyRevenuePoint[]) => ChartDatum[]> = {
  Monthly: toMonthly,
  Quarterly: toQuarterly,
  Yearly: toYearly,
};

export default function ProfitTrendCard() {
  const { colors } = useColors();

  const { data = [], isLoading } = useMonthlyRevenue();
  const [selectedFilter, setSelectedFilter] = useState<FilterOption>("Monthly");

  const chartData = BUILDERS[selectedFilter](data);
  const maxValue = chartData.reduce((max, datum) => Math.max(max, datum.value), 0);
  const hasRevenue = chartData.some((datum) => datum.value > 0);

  return (
    <View className="w-full border border-border p-4 rounded-3xl bg-surface">
      {/* HEADER */}
      <View className="flex-row items-center justify-between">
        <View className="flex">
          <Text className="text-accent font-interSemiBold text-xl">
            Profit Trend
          </Text>
          <Text className="text-muted font-inter">
            Track your profit over time
          </Text>
        </View>

        <DropdownButton
          label="Select Timeframe"
          options={filterOptions}
          value={selectedFilter}
          onSelect={setSelectedFilter}
        />
      </View>

      {/* CHART */}
      <View className="mt-4 overflow-hidden">
        {isLoading ? (
          <View className="h-45 items-center justify-center">
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : !hasRevenue ? (
          <EmptyState
            icon={<IconChartLine size={36} color={colors.gray500} />}
            title="No earnings yet"
            description="Your profit trend will appear here once payments come in."
          />
        ) : (
          <LineChart
            data={chartData}
            height={180}
            width={280}
            curved
            color={colors.primary}
            thickness={2.5}
            dataPointsColor={colors.primary}
            dataPointsRadius={4}
            startFillColor={colors.primary}
            endFillColor={"#ffffff"}
            startOpacity={0.2}
            endOpacity={0.01}
            areaChart
            maxValue={maxValue + 2000}
            noOfSections={4}
            yAxisColor="transparent"
            xAxisColor="#e5e7eb"
            rulesColor="#f3f4f6"
            rulesType="solid"
            yAxisTextStyle={{ color: "#9ca3af", fontSize: 10, fontFamily: "Inter" }}
            xAxisLabelTextStyle={{ color: "#9ca3af", fontSize: 10, fontFamily: "Inter" }}
            hideDataPoints={false}
            showVerticalLines={false}
            formatYLabel={(val) => `₱${Number(val) / 1000}k`}
            pointerConfig={{
              pointerStripHeight: 140,
              pointerStripColor: colors.primary,
              pointerStripWidth: 1,
              pointerColor: colors.primary,
              radius: 5,
              pointerLabelWidth: 90,
              pointerLabelHeight: 38,
              activatePointersOnLongPress: false,
              autoAdjustPointerLabelPosition: true,
              pointerLabelComponent: (items: any) => (
                <View
                  style={{
                    backgroundColor: colors.primary,
                    borderRadius: 8,
                    paddingHorizontal: 8,
                    paddingVertical: 4,
                  }}
                >
                  <Text style={{ color: "white", fontSize: 11, fontWeight: "600" }}>
                    ₱{items[0].value.toLocaleString()}
                  </Text>
                </View>
              ),
            }}
          />
        )}
      </View>
    </View>
  );
}
