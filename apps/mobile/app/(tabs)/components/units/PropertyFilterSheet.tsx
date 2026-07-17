import { View, Text } from "react-native";
import { IconFilter2 } from "@tabler/icons-react-native";
import { BottomSheet, Chip, Button, Separator } from "heroui-native";

import { APARTMENT_STATUS_LABELS } from "@repo/constants";
import { useColors } from "@/hooks/useTheme";

export const sortOptions = ["none", "price_asc", "price_desc"] as const;
export type SortOption = (typeof sortOptions)[number];

const SORT_LABELS: Record<SortOption, string> = {
  none: "Default",
  price_asc: "Low to High",
  price_desc: "High to Low",
};

const STATUS_FILTER_LABELS: Record<string, string> = {
  All: "All",
  ...APARTMENT_STATUS_LABELS,
};

interface PropertyFilterSheetProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;

  statusOptions: string[];
  selectedStatus: string;
  onSelectStatus: (status: string) => void;

  locationOptions: string[];
  selectedLocation: string;
  onSelectLocation: (location: string) => void;

  selectedSort: SortOption;
  onSelectSort: (sort: SortOption) => void;

  activeFilterCount: number;
  hasActiveFilters: boolean;
  onClear: () => void;
}

export default function PropertyFilterSheet({
  isOpen,
  onOpenChange,
  statusOptions,
  selectedStatus,
  onSelectStatus,
  locationOptions,
  selectedLocation,
  onSelectLocation,
  selectedSort,
  onSelectSort,
  activeFilterCount,
  hasActiveFilters,
  onClear,
}: PropertyFilterSheetProps) {
  const { colors } = useColors();

  return (
    <BottomSheet isOpen={isOpen} onOpenChange={onOpenChange}>
      <View className="relative">
        <BottomSheet.Trigger asChild>
          <Button isIconOnly variant="secondary">
            <IconFilter2 size={18} color={colors.textPrimary} />
          </Button>
        </BottomSheet.Trigger>

        {hasActiveFilters && (
          <View
            className="absolute -top-0.5 -right-0.5 min-w-4 h-4 rounded-full bg-accent items-center justify-center"
            style={{ zIndex: 10 }}
          >
            <Text className="text-white text-[10px] font-interMedium leading-none -mb-0.5">
              {activeFilterCount}
            </Text>
          </View>
        )}
      </View>

      <BottomSheet.Portal>
        <BottomSheet.Overlay />
        <BottomSheet.Content>
          <BottomSheet.Title>Filter Properties</BottomSheet.Title>

          <View className="gap-5 mt-4">
            <View className="gap-2">
              <Text className="text-foreground font-interMedium text-sm">
                Status
              </Text>
              <View className="flex-row flex-wrap gap-2">
                {statusOptions.map((status) => {
                  const isSelected = selectedStatus === status;
                  return (
                    <Chip
                      key={status}
                      variant={isSelected ? "soft" : "secondary"}
                      color={isSelected ? "accent" : "default"}
                      onPress={() => onSelectStatus(status)}
                    >
                      <Chip.Label>{STATUS_FILTER_LABELS[status]}</Chip.Label>
                    </Chip>
                  );
                })}
              </View>
            </View>

            <Separator />

            <View className="gap-2">
              <Text className="text-foreground font-interMedium text-sm">
                Location
              </Text>
              <View className="flex-row flex-wrap gap-2">
                {locationOptions.map((location) => {
                  const isSelected = selectedLocation === location;
                  return (
                    <Chip
                      key={location}
                      variant={isSelected ? "soft" : "secondary"}
                      color={isSelected ? "accent" : "default"}
                      onPress={() => onSelectLocation(location)}
                    >
                      <Chip.Label>{location}</Chip.Label>
                    </Chip>
                  );
                })}
              </View>
            </View>

            <Separator />

            <View className="gap-2">
              <Text className="text-foreground font-interMedium text-sm">
                Sort by Price
              </Text>
              <View className="flex-row flex-wrap gap-2">
                {sortOptions.map((sort) => {
                  const isSelected = selectedSort === sort;
                  return (
                    <Chip
                      key={sort}
                      variant={isSelected ? "soft" : "secondary"}
                      color={isSelected ? "accent" : "default"}
                      onPress={() => onSelectSort(sort)}
                    >
                      <Chip.Label>{SORT_LABELS[sort]}</Chip.Label>
                    </Chip>
                  );
                })}
              </View>
            </View>

            <View className="flex-row gap-3 mt-2">
              <Button
                variant="secondary"
                className="flex-1"
                onPress={onClear}
                isDisabled={!hasActiveFilters}
              >
                Clear
              </Button>
              <Button
                variant="primary"
                className="flex-1"
                onPress={() => onOpenChange(false)}
              >
                Done
              </Button>
            </View>
          </View>
        </BottomSheet.Content>
      </BottomSheet.Portal>
    </BottomSheet>
  );
}
