import { useCallback } from "react";
import { Pressable, Text, View } from "react-native";

import { BottomSheet, Button, Chip, Separator } from "heroui-native";

import type { ApplicationStatus } from "@/hooks/applications";

export type ApplicationSort = "pending_first" | "newest" | "oldest";

export type TenantApplicationFilters = {
  statuses: ApplicationStatus[];
  sort: ApplicationSort;
};

const STATUS_OPTIONS: { label: string; value: ApplicationStatus }[] = [
  { label: "Pending", value: "pending" },
  { label: "Approved", value: "approved" },
  { label: "Rejected", value: "rejected" },
  { label: "Cancelled", value: "cancelled" },
  { label: "Closed", value: "closed" },
];

const SORT_OPTIONS: { label: string; value: ApplicationSort }[] = [
  { label: "Pending first", value: "pending_first" },
  { label: "Newest first", value: "newest" },
  { label: "Oldest first", value: "oldest" },
];

export const DEFAULT_TENANT_APPLICATION_FILTERS: TenantApplicationFilters = {
  statuses: [],
  sort: "pending_first",
};

interface ApplicationFilterSheetProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  filters: TenantApplicationFilters;
  onChange: (filters: TenantApplicationFilters) => void;
}

export default function ApplicationFilterSheet({
  isOpen,
  onOpenChange,
  filters,
  onChange,
}: ApplicationFilterSheetProps) {
  const toggleStatus = useCallback(
    (status: ApplicationStatus) => {
      const statuses = filters.statuses.includes(status)
        ? filters.statuses.filter((value) => value !== status)
        : [...filters.statuses, status];
      onChange({ ...filters, statuses });
    },
    [filters, onChange],
  );

  const isDefault =
    filters.statuses.length === 0 && filters.sort === DEFAULT_TENANT_APPLICATION_FILTERS.sort;

  return (
    <BottomSheet isOpen={isOpen} onOpenChange={onOpenChange}>
      <BottomSheet.Portal>
        <BottomSheet.Overlay />
        <BottomSheet.Content>
          <View className="flex-row items-center justify-between pb-4">
            <Text className="text-lg font-nunitoSemiBold text-foreground">Filter & sort</Text>
            {!isDefault && (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Reset application filters"
                onPress={() => onChange(DEFAULT_TENANT_APPLICATION_FILTERS)}
              >
                <Text className="text-sm font-inter text-danger">Reset</Text>
              </Pressable>
            )}
          </View>

          <View>
            <Text className="mb-3 text-sm font-inter text-muted">Status</Text>
            <View className="flex-row flex-wrap gap-2">
              {STATUS_OPTIONS.map((option) => {
                const selected = filters.statuses.includes(option.value);
                return (
                  <Chip
                    key={option.value}
                    variant={selected ? "primary" : "secondary"}
                    color={selected ? "accent" : "default"}
                    onPress={() => toggleStatus(option.value)}
                  >
                    <Chip.Label>{option.label}</Chip.Label>
                  </Chip>
                );
              })}
            </View>

            <Separator className="my-6" />

            <Text className="mb-3 text-sm font-inter text-muted">Sort by</Text>
            <View className="mb-16 flex-row flex-wrap gap-2">
              {SORT_OPTIONS.map((option) => {
                const selected = filters.sort === option.value;
                return (
                  <Chip
                    key={option.value}
                    variant={selected ? "primary" : "secondary"}
                    color={selected ? "accent" : "default"}
                    onPress={() => onChange({ ...filters, sort: option.value })}
                  >
                    <Chip.Label>{option.label}</Chip.Label>
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
