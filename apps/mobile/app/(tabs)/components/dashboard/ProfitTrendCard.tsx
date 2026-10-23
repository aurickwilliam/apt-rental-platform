import { View, Text } from "react-native";
import { useState } from "react";
import type { LayoutChangeEvent } from "react-native";
import { LineChart } from "react-native-gifted-charts";
import { IconChartLine } from "@tabler/icons-react-native";

import {
  TREND_TIMEFRAMES,
  buildTrendSeries,
  formatPesoCompact,
  type TrendTimeframe,
} from "@repo/utils";

import DropdownButton from "@/components/buttons/DropdownButton";
import EmptyState from "@/components/display/EmptyState";

import { useColors } from "@/hooks/useTheme";

import type { MonthlyRevenuePoint } from "@/service/dashboard/dashboardService";

const Y_AXIS_LABEL_WIDTH = 44;
const SIDE_SPACING = 12;
/** Narrowest gap between points; more points than fit scroll sideways. */
const MIN_POINT_SPACING = 48;

interface ProfitTrendCardProps {
  monthlyRevenue: MonthlyRevenuePoint[];
}

export default function ProfitTrendCard({ monthlyRevenue }: ProfitTrendCardProps) {
  const { colors, isDark } = useColors();

  const [selectedFilter, setSelectedFilter] = useState<TrendTimeframe>("Monthly");

  // Measured so the plot fills the card; points keep a readable gap and the
  // chart scrolls sideways (opening on the latest month) when they don't fit.
  const [chartAreaWidth, setChartAreaWidth] = useState(0);
  const handleLayout = (event: LayoutChangeEvent) =>
    setChartAreaWidth(event.nativeEvent.layout.width);

  const chartData = buildTrendSeries(monthlyRevenue, selectedFilter);
  const plotWidth = Math.max(chartAreaWidth - Y_AXIS_LABEL_WIDTH, 0);
  const fitSpacing =
    chartData.length > 1
      ? (plotWidth - SIDE_SPACING * 2) / (chartData.length - 1)
      : 0;
  const pointSpacing = Math.max(fitSpacing, MIN_POINT_SPACING);
  const maxValue = chartData.reduce((max, datum) => Math.max(max, datum.value), 0);
  const hasRevenue = chartData.some((datum) => datum.value > 0);
  // Headroom above the tallest point so the curve is never clipped at the top.
  const chartMax = Math.ceil((maxValue * 1.15) / 1000) * 1000;

  return (
    <View className="w-full border border-border p-4 rounded-3xl bg-surface">
      {/* HEADER */}
      <View className="flex-row items-center justify-between">
        <View className="flex">
          <Text className="text-accent font-nunitoBold text-xl">
            Profit Trend
          </Text>
          <Text className="text-muted font-inter">
            Track your profit over time
          </Text>
        </View>

        <DropdownButton
          label="Select Timeframe"
          options={[...TREND_TIMEFRAMES]}
          value={selectedFilter}
          onSelect={setSelectedFilter}
        />
      </View>

      {/* CHART */}
      <View className="mt-4 overflow-hidden" onLayout={handleLayout}>
        {!hasRevenue ? (
          <EmptyState
            icon={<IconChartLine size={36} color={colors.gray500} />}
            title="No earnings yet"
            description="Your profit trend will appear here once payments come in."
          />
        ) : chartAreaWidth === 0 ? null : (
          <LineChart
            data={chartData}
            height={180}
            width={plotWidth}
            yAxisLabelWidth={Y_AXIS_LABEL_WIDTH}
            initialSpacing={SIDE_SPACING}
            endSpacing={SIDE_SPACING}
            spacing={pointSpacing}
            scrollToEnd
            scrollAnimation={false}
            curved
            curvature={0.12}
            color={colors.primary}
            thickness={2.5}
            dataPointsColor={colors.primary}
            dataPointsRadius={4}
            startFillColor={colors.primary}
            endFillColor={isDark ? colors.surface : "#ffffff"}
            startOpacity={0.2}
            endOpacity={0.01}
            areaChart
            maxValue={chartMax}
            noOfSections={4}
            yAxisColor="transparent"
            xAxisColor={isDark ? colors.gray200 : "#e5e7eb"}
            rulesColor={isDark ? colors.gray200 : "#f3f4f6"}
            rulesType="solid"
            yAxisTextStyle={{ color: "#9ca3af", fontSize: 10, fontFamily: "Nunito-SemiBold" }}
            xAxisLabelTextStyle={{ color: "#9ca3af", fontSize: 9, fontFamily: "Nunito-SemiBold" }}
            hideDataPoints={false}
            showVerticalLines={false}
            formatYLabel={(val) => formatPesoCompact(Number(val))}
            pointerConfig={{
              pointerStripHeight: 140,
              pointerStripColor: colors.primary,
              pointerStripWidth: 1,
              pointerColor: colors.primary,
              radius: 5,
              pointerLabelWidth: 90,
              pointerLabelHeight: 38,
              // A plain drag scrolls the chart; press and hold to read a value.
              activatePointersOnLongPress: true,
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
