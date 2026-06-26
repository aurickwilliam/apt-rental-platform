import { useCallback } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { BottomSheet, Button, Chip, Separator } from "heroui-native";

export type DateRange = "Today" | "This Week" | "This Month" | "Past";

export type VisitRequestFilters = {
  statuses: string[];
  dateRanges: DateRange[];
};

const STATUS_OPTIONS = [
  { label: "Pending", value: "pending" },
  { label: "Approved", value: "approved" },
  { label: "Rejected", value: "rejected" },
  { label: "Cancelled", value: "cancelled" },
  { label: "Rescheduled", value: "rescheduled" },
];

const DATE_RANGE_OPTIONS: { label: string; value: DateRange }[] = [
  { label: "Today", value: "Today" },
  { label: "This Week", value: "This Week" },
  { label: "This Month", value: "This Month" },
  { label: "Past", value: "Past" },
];

type Props = {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  filters: VisitRequestFilters;
  onChange: (filters: VisitRequestFilters) => void;
};

export default function VisitRequestFilterSheet({
  isOpen,
  onOpenChange,
  filters,
  onChange,
}: Props) {
  const toggleStatus = useCallback(
    (value: string) => {
      const next = filters.statuses.includes(value)
        ? filters.statuses.filter((v) => v !== value)
        : [...filters.statuses, value];
      onChange({ ...filters, statuses: next });
    },
    [filters, onChange]
  );

  const toggleDateRange = useCallback(
    (value: DateRange) => {
      const next = filters.dateRanges.includes(value)
        ? filters.dateRanges.filter((v) => v !== value)
        : [...filters.dateRanges, value];
      onChange({ ...filters, dateRanges: next });
    },
    [filters, onChange]
  );

  const reset = () => onChange({ statuses: [], dateRanges: [] });
  const activeCount = filters.statuses.length + filters.dateRanges.length;

  return (
    <BottomSheet isOpen={isOpen} onOpenChange={onOpenChange}>
      <BottomSheet.Portal>
        <BottomSheet.Overlay />
        <BottomSheet.Content>
          <View className="flex-row items-center justify-between pb-4">
            <Text className="text-lg font-interMedium text-foreground">
              Filters
            </Text>
            {activeCount > 0 && (
              <TouchableOpacity onPress={reset} activeOpacity={0.7}>
                <Text className="text-sm font-inter text-danger">
                  Clear all
                </Text>
              </TouchableOpacity>
            )}
          </View>

          <View>
            {/* Status */}
            <Text className="text-sm font-inter text-muted mb-3">Status</Text>
            <View className="flex-row flex-wrap gap-2">
              {STATUS_OPTIONS.map((opt) => {
                const selected = filters.statuses.includes(opt.value);
                return (
                  <Chip
                    key={opt.value}
                    variant={selected ? "primary" : "secondary"}
                    color={selected ? "accent" : "default"}
                    onPress={() => toggleStatus(opt.value)}
                  >
                    <Chip.Label>{opt.label}</Chip.Label>
                  </Chip>
                );
              })}
            </View>

            <Separator className="my-6" />

            {/* Visit Date */}
            <Text className="text-sm font-inter text-muted mb-3">
              Visit Date
            </Text>
            <View className="flex-row flex-wrap gap-2 mb-16">
              {DATE_RANGE_OPTIONS.map((opt) => {
                const selected = filters.dateRanges.includes(opt.value);
                return (
                  <Chip
                    key={opt.value}
                    variant={selected ? "primary" : "secondary"}
                    color={selected ? "accent" : "default"}
                    onPress={() => toggleDateRange(opt.value)}
                  >
                    <Chip.Label>{opt.label}</Chip.Label>
                  </Chip>
                );
              })}
            </View>

            <Button onPress={() => onOpenChange(false)}>
              <Button.Label>Done</Button.Label>
            </Button>
          </View>
        </BottomSheet.Content>
      </BottomSheet.Portal>
    </BottomSheet>
  );
}
