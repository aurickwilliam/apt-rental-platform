import { Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BottomSheet, Button } from "heroui-native";

import DropdownButton from "@/components/buttons/DropdownButton";

const DROPDOWN_CLASS =
  "bg-surface px-4 py-3 rounded-2xl flex-row items-center justify-between gap-2 border border-field-border";

interface PaymentFilterSheetProps<Year extends string, Sort extends string> {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  /** Option labels, the first being "every year". */
  yearOptions: Year[];
  year: Year;
  onYearChange: (year: Year) => void;
  sortOptions: Sort[];
  sort: Sort;
  onSortChange: (sort: Sort) => void;
  /** Puts the year and the sort back to their defaults. */
  onReset: () => void;
  /** Whether anything differs from the defaults; Reset is disabled otherwise. */
  isChanged: boolean;
}

// The year and the sort live here, not on the screen: the screen shows the status
// menu and a filter icon. The sheet stays mounted and is driven by `isOpen` (HeroUI
// only snaps a sheet open on a closed -> open change). Its dropdowns are popovers, so
// the sheet's full-window overlay is turned off: on iOS it would draw above them.
export default function PaymentFilterSheet<Year extends string, Sort extends string>({
  isOpen,
  onOpenChange,
  yearOptions,
  year,
  onYearChange,
  sortOptions,
  sort,
  onSortChange,
  onReset,
  isChanged,
}: PaymentFilterSheetProps<Year, Sort>) {
  const insets = useSafeAreaInsets();

  return (
    <BottomSheet isOpen={isOpen} onOpenChange={onOpenChange}>
      <BottomSheet.Portal disableFullWindowOverlay>
        <BottomSheet.Overlay />
        <BottomSheet.Content snapPoints={["50%"]} enableDynamicSizing={false} contentContainerClassName="h-full">
          <View className="flex-1 justify-between gap-4" style={{ paddingBottom: insets.bottom + 8 }}>
            <View className="gap-4">
              <View className="flex-row items-center justify-between">
                <BottomSheet.Title className="font-nunitoBold text-xl text-foreground">
                  Filters
                </BottomSheet.Title>
                <Button size="sm" variant="ghost" isDisabled={!isChanged} onPress={onReset}>
                  <Button.Label>Reset</Button.Label>
                </Button>
              </View>
              <BottomSheet.Description className="font-inter text-sm text-muted">
                Narrow the list to one year and choose how it is sorted.
              </BottomSheet.Description>

              <View className="gap-2">
                <Text className="font-nunitoSemiBold text-base text-foreground">Year</Text>
                <DropdownButton
                  options={yearOptions}
                  value={year}
                  onSelect={onYearChange}
                  width="trigger"
                  align="start"
                  highlightSelected
                  buttonClassName={DROPDOWN_CLASS}
                  textClassName="text-foreground text-base font-inter flex-1"
                />
              </View>

              <View className="gap-2">
                <Text className="font-nunitoSemiBold text-base text-foreground">Sort</Text>
                <DropdownButton
                  options={sortOptions}
                  value={sort}
                  onSelect={onSortChange}
                  width="trigger"
                  align="start"
                  highlightSelected
                  buttonClassName={DROPDOWN_CLASS}
                  textClassName="text-foreground text-base font-inter flex-1"
                />
              </View>

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
