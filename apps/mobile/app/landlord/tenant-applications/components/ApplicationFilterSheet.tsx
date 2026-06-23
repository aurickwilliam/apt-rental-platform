import { useCallback } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';

import { BottomSheet, Button, Chip, Separator } from 'heroui-native';

export type ApplicationFilters = {
  statuses: string[];
  locations: string[];
};

const STATUS_OPTIONS = [
  { label: 'Applied', value: 'Applied' },
  { label: 'Approved', value: 'Approved' },
  { label: 'Rejected', value: 'Rejected' },
  { label: 'Cancelled', value: 'Cancelled' },
];

const LOCATION_OPTIONS = [
  { label: 'Caloocan', value: 'caloocan' },
  { label: 'Malabon', value: 'malabon' },
  { label: 'Navotas', value: 'navotas' },
  { label: 'Valenzuela', value: 'valenzuela' },
];

type Props = {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  filters: ApplicationFilters;
  onChange: (filters: ApplicationFilters) => void;
};

export default function ApplicationFilterSheet({
  isOpen,
  onOpenChange,
  filters,
  onChange,
}: Props) {
  const toggle = useCallback(
    (key: keyof ApplicationFilters, value: string) => {
      const current = filters[key];
      const next = current.includes(value)
        ? current.filter((v) => v !== value)
        : [...current, value];
      onChange({ ...filters, [key]: next });
    },
    [filters, onChange]
  );

  const reset = () => onChange({ statuses: [], locations: [] });
  const activeCount = filters.statuses.length + filters.locations.length;

  return (
    <BottomSheet isOpen={isOpen} onOpenChange={onOpenChange}>
      <BottomSheet.Portal>
        <BottomSheet.Overlay />
        <BottomSheet.Content>
          {/* Header */}
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
            <Text className="text-sm font-inter text-muted mb-3">
              Status
            </Text>
            <View className="flex-row flex-wrap gap-2">
              {STATUS_OPTIONS.map((opt) => {
                const selected = filters.statuses.includes(opt.value);
                return (
                  <Chip
                    key={opt.value}
                    variant={selected ? 'primary' : 'secondary'}
                    color={selected ? 'accent' : 'default'}
                    onPress={() => toggle('statuses', opt.value)}
                  >
                    <Chip.Label>{opt.label}</Chip.Label>
                  </Chip>
                );
              })}
            </View>

            {/* Separator */}
            <Separator className="my-6" />

            {/* Location */}
            <Text className="text-sm font-inter text-muted mb-3">
              Location
            </Text>
            <View className="flex-row flex-wrap gap-2 mb-16">
              {LOCATION_OPTIONS.map((opt) => {
                const selected = filters.locations.includes(opt.value);
                return (
                  <Chip
                    key={opt.value}
                    variant={selected ? 'primary' : 'secondary'}
                    color={selected ? 'accent' : 'default'}
                    onPress={() => toggle('locations', opt.value)}
                  >
                    <Chip.Label>{opt.label}</Chip.Label>
                  </Chip>
                );
              })}
            </View>

            <Button onPress={() => onOpenChange(false)}>
              <Button.Label>
                Done
              </Button.Label>
            </Button>
          </View>
        </BottomSheet.Content>
      </BottomSheet.Portal>
    </BottomSheet>
  );
}
