import { useCallback } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { BottomSheet, Button, Chip, Separator } from 'heroui-native';

import { PAYMENT_STATUS } from '@repo/constants';

export type PaymentSort = 'Newest' | 'Oldest';

export type PaymentHistoryFilters = {
  years: string[];
  statuses: string[];
  sort: PaymentSort;
};

const SORT_OPTIONS: PaymentSort[] = ['Newest', 'Oldest'];

type Props = {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  filters: PaymentHistoryFilters;
  onChange: (filters: PaymentHistoryFilters) => void;
  /** Years that exist in the payment history (drives the Year chips) */
  availableYears: string[];
};

export default function PaymentHistoryFilterSheet({
  isOpen,
  onOpenChange,
  filters,
  onChange,
  availableYears,
}: Props) {
  const toggle = useCallback(
    (key: 'years' | 'statuses', value: string) => {
      const current = filters[key];
      const next = current.includes(value)
        ? current.filter((v) => v !== value)
        : [...current, value];
      onChange({ ...filters, [key]: next });
    },
    [filters, onChange]
  );

  const selectSort = useCallback(
    (value: PaymentSort) => {
      onChange({ ...filters, sort: value });
    },
    [filters, onChange]
  );

  const reset = () => onChange({ years: [], statuses: [], sort: 'Newest' });
  const activeCount = filters.years.length + filters.statuses.length;

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
            {/* Year */}
            <Text className="text-sm font-inter text-muted mb-3">Year</Text>
            <View className="flex-row flex-wrap gap-2">
              {availableYears.map((year) => {
                const selected = filters.years.includes(year);
                return (
                  <Chip
                    key={year}
                    variant={selected ? 'primary' : 'secondary'}
                    color={selected ? 'accent' : 'default'}
                    onPress={() => toggle('years', year)}
                  >
                    <Chip.Label>{year}</Chip.Label>
                  </Chip>
                );
              })}
            </View>

            <Separator className="my-6" />

            {/* Status */}
            <Text className="text-sm font-inter text-muted mb-3">Status</Text>
            <View className="flex-row flex-wrap gap-2">
              {PAYMENT_STATUS.map((status) => {
                const selected = filters.statuses.includes(status);
                return (
                  <Chip
                    key={status}
                    variant={selected ? 'primary' : 'secondary'}
                    color={selected ? 'accent' : 'default'}
                    onPress={() => toggle('statuses', status)}
                  >
                    <Chip.Label>{status}</Chip.Label>
                  </Chip>
                );
              })}
            </View>

            <Separator className="my-6" />

            {/* Sort */}
            <Text className="text-sm font-inter text-muted mb-3">Sort by</Text>
            <View className="flex-row flex-wrap gap-2 mb-16">
              {SORT_OPTIONS.map((sort) => {
                const selected = filters.sort === sort;
                return (
                  <Chip
                    key={sort}
                    variant={selected ? 'primary' : 'secondary'}
                    color={selected ? 'accent' : 'default'}
                    onPress={() => selectSort(sort)}
                  >
                    <Chip.Label>{sort}</Chip.Label>
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
