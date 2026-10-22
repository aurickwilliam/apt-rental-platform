import { useEffect, useRef, useState } from "react";
import { View, Text } from "react-native";
import type { LayoutChangeEvent, ScrollView } from "react-native";
import { BarChart } from "react-native-gifted-charts";
import { IconChartBar } from "@tabler/icons-react-native";

import {
  formatPesoCompact,
  formatPesoDisplay,
  monthLabel,
  summarizeCollection,
  type CollectionMonthPoint,
} from "@repo/utils";

import EmptyState from "@/components/display/EmptyState";

import { useColors } from "@/hooks/useTheme";

const Y_AXIS_LABEL_WIDTH = 44;
const SIDE_SPACING = 12;
const BAR_WIDTH = 34;
/** Narrowest gap between bars; more bars than fit scroll sideways. */
const MIN_BAR_GAP = 30;

interface CollectionHistoryCardProps {
  collectionByMonth: CollectionMonthPoint[];
}

function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <View className="flex-row items-center gap-2">
      <View style={{ backgroundColor: color }} className="size-3 rounded-full" />
      <Text className="text-muted font-inter text-sm">{label}</Text>
    </View>
  );
}

export default function CollectionHistoryCard({
  collectionByMonth,
}: CollectionHistoryCardProps) {
  const { colors, isDark } = useColors();

  // Measured so the plot fills the card; bars keep a readable gap and the
  // chart scrolls sideways (opening on the latest month) when they don't fit.
  const [chartAreaWidth, setChartAreaWidth] = useState(0);
  const scrollRef = useRef<ScrollView>(null);
  const handleLayout = (event: LayoutChangeEvent) =>
    setChartAreaWidth(event.nativeEvent.layout.width);

  const { percent } = summarizeCollection(collectionByMonth);
  const maxBilled = collectionByMonth.reduce(
    (max, point) => Math.max(max, point.collected + point.unpaid),
    0,
  );
  const hasBilledRent = maxBilled > 0;

  const plotWidth = Math.max(chartAreaWidth - Y_AXIS_LABEL_WIDTH, 0);
  const barCount = collectionByMonth.length;
  const fitGap =
    barCount > 1
      ? (plotWidth - SIDE_SPACING * 2 - barCount * BAR_WIDTH) / (barCount - 1)
      : 0;
  const barGap = Math.max(fitGap, MIN_BAR_GAP);

  // The chart's own scrollToEnd only fires when its content resizes, which a
  // stacked chart does not do on first paint, so open on the latest month here.
  useEffect(() => {
    if (chartAreaWidth === 0 || !hasBilledRent) return;
    const timer = setTimeout(
      () => scrollRef.current?.scrollToEnd({ animated: false }),
      0,
    );
    return () => clearTimeout(timer);
  }, [chartAreaWidth, hasBilledRent, barCount]);

  const stackData = collectionByMonth.map((point) => ({
    label: monthLabel(point.month),
    stacks: [
      { value: point.collected, color: colors.primary },
      {
        value: point.unpaid,
        color: colors.warning,
        borderTopLeftRadius: 6,
        borderTopRightRadius: 6,
      },
    ],
  }));

  return (
    <View className="w-full border border-border p-4 rounded-3xl bg-surface">
      {/* HEADER */}
      <View className="flex-row items-start justify-between gap-3">
        <View className="flex-1">
          <Text className="text-accent font-nunitoBold text-xl">Rent Collection</Text>
          <Text className="text-muted font-inter">
            Collected vs unpaid rent, last 6 months
          </Text>
        </View>

        {hasBilledRent ? (
          <View className="bg-primary-light rounded-full px-3 py-1">
            <Text className="text-primary-light-foreground font-nunitoSemiBold text-sm">
              {percent}% collected
            </Text>
          </View>
        ) : null}
      </View>

      {/* CHART */}
      <View className="mt-4 overflow-hidden" onLayout={handleLayout}>
        {!hasBilledRent ? (
          <EmptyState
            icon={<IconChartBar size={36} color={colors.gray500} />}
            title="No rent billed yet"
            description="Once rent comes due, collected and unpaid amounts show up here."
          />
        ) : (
          <>
            <View className="flex-row gap-4 mb-3">
              <LegendItem color={colors.primary} label="Collected" />
              <LegendItem color={colors.warning} label="Unpaid" />
            </View>

            {chartAreaWidth === 0 ? null : (
            <BarChart
              stackData={stackData}
              height={180}
              width={plotWidth}
              yAxisLabelWidth={Y_AXIS_LABEL_WIDTH}
              initialSpacing={SIDE_SPACING}
              endSpacing={SIDE_SPACING}
              scrollRef={scrollRef}
              barWidth={BAR_WIDTH}
              spacing={barGap}
              maxValue={Math.ceil((maxBilled * 1.1) / 1000) * 1000}
              noOfSections={4}
              yAxisColor="transparent"
              xAxisColor={isDark ? colors.gray200 : "#e5e7eb"}
              rulesColor={isDark ? colors.gray200 : "#f3f4f6"}
              rulesType="solid"
              yAxisTextStyle={{ color: "#9ca3af", fontSize: 10, fontFamily: "Nunito-SemiBold" }}
              xAxisLabelTextStyle={{
                color: colors.textPrimary,
                fontSize: 10,
                fontFamily: "Nunito-SemiBold",
                textAlign: "center",
              }}
              formatYLabel={(val) => formatPesoCompact(Number(val))}
              renderTooltip={(item: { stacks?: { value: number }[] }) => {
                const [collected = 0, unpaid = 0] = (item.stacks ?? []).map(
                  (stack) => stack.value,
                );
                return (
                  <View
                    style={{
                      backgroundColor: colors.primary,
                      borderRadius: 6,
                      paddingHorizontal: 6,
                      paddingVertical: 3,
                      marginBottom: 4,
                    }}
                  >
                    <Text style={{ color: "white", fontSize: 10, fontWeight: "600" }}>
                      {formatPesoDisplay(collected) || "₱ 0"} paid
                      {unpaid > 0 ? ` · ${formatPesoDisplay(unpaid)} unpaid` : ""}
                    </Text>
                  </View>
                );
              }}
            />
            )}
          </>
        )}
      </View>
    </View>
  );
}
