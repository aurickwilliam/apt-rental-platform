import { useCallback, useState } from "react";
import { Keyboard, Text, View } from "react-native";
import {
  BottomSheetFooter,
  BottomSheetScrollView,
  type BottomSheetFooterProps,
} from "@gorhom/bottom-sheet";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { IconChevronLeft, IconChevronRight } from "@tabler/icons-react-native";
import { useColors } from "@/hooks/useTheme";
import {
  BottomSheet,
  Button,
  SearchField,
  useBottomSheetAwareHandlers,
} from "heroui-native";
import { financeMonthLabel, shiftFinanceMonth } from "@repo/utils";
import type {
  FinanceProperty,
  FinanceScope,
} from "@/service/finance/financeService";
import { FinanceTabs } from "./FinanceControls";

const REPORT_MONTH_COUNT = 24;
const FILTER_TABS = [
  { value: "property", label: "Property" },
  { value: "month", label: "Month" },
];

interface FinanceFilterSheetProps {
  isOpen: boolean;
  value: FinanceScope;
  currentMonth: string;
  properties: FinanceProperty[];
  onChange: (value: FinanceScope) => void;
  onApply: () => void;
  onClose: () => void;
}

function PropertySearch({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const handlers = useBottomSheetAwareHandlers();
  return (
    <SearchField value={value} onChange={onChange}>
      <SearchField.Group>
        <SearchField.SearchIcon />
        <SearchField.Input
          accessibilityLabel="Search properties"
          placeholder="Search properties…"
          autoCorrect={false}
          autoFocus={false}
          returnKeyType="done"
          onSubmitEditing={() => Keyboard.dismiss()}
          {...handlers}
        />
        <SearchField.ClearButton accessibilityLabel="Clear property search" />
      </SearchField.Group>
    </SearchField>
  );
}

export default function FinanceFilterSheet({
  isOpen,
  value,
  currentMonth,
  properties,
  onChange,
  onApply,
  onClose,
}: FinanceFilterSheetProps) {
  const insets = useSafeAreaInsets();
  const { colors } = useColors();
  const [tab, setTab] = useState("property");
  const [search, setSearch] = useState("");
  const [year, setYear] = useState(Number(value.month.slice(0, 4)));
  const [wasOpen, setWasOpen] = useState(isOpen);
  if (isOpen !== wasOpen) {
    setWasOpen(isOpen);
    if (isOpen) {
      setTab("property");
      setSearch("");
      setYear(Number(value.month.slice(0, 4)));
    }
  }
  const oldestMonth = shiftFinanceMonth(
    currentMonth,
    -(REPORT_MONTH_COUNT - 1),
  );
  const searchTerm = search.trim().toLocaleLowerCase();
  const propertyOptions = [
    { id: null, name: "All properties" },
    ...properties,
  ].filter(
    (property) =>
      property.id === null ||
      property.name.toLocaleLowerCase().includes(searchTerm),
  );
  const propertyName =
    properties.find((property) => property.id === value.apartmentId)?.name ??
    "All properties";
  const close = useCallback(() => {
    Keyboard.dismiss();
    onClose();
  }, [onClose]);
  const renderFooter = useCallback(
    (props: BottomSheetFooterProps) => (
      <BottomSheetFooter {...props} bottomInset={insets.bottom}>
        <View className="px-5 py-3 gap-3 border-t border-border bg-surface">
          <Text
            className="font-inter text-sm text-foreground"
            accessibilityLiveRegion="polite"
          >
            {propertyName} · {financeMonthLabel(value.month)}
          </Text>
          <View className="flex-row gap-3">
            <Button className="flex-1" variant="tertiary" onPress={close}>
              <Button.Label>Cancel</Button.Label>
            </Button>
            <Button
              className="flex-1"
              onPress={() => {
                Keyboard.dismiss();
                onApply();
              }}
            >
              <Button.Label>Apply filters</Button.Label>
            </Button>
          </View>
        </View>
      </BottomSheetFooter>
    ),
    [close, insets.bottom, onApply, propertyName, value.month],
  );

  // Keep the root and content mounted: HeroUI opens on a closed → open transition.
  return (
    <BottomSheet
      isOpen={isOpen}
      onOpenChange={(open) => {
        if (!open) close();
      }}
    >
      <BottomSheet.Portal>
        <BottomSheet.Overlay />
        <BottomSheet.Content
          snapPoints={["100%"]}
          enableDynamicSizing={false}
          enableOverDrag={false}
          topInset={insets.top}
          keyboardBehavior="fillParent"
          keyboardBlurBehavior="restore"
          enableBlurKeyboardOnGesture
          footerComponent={renderFooter}
          contentContainerClassName="h-full"
        >
          <View className="px-2 gap-3 pb-3">
            <View className="flex-row items-center justify-between">
              <BottomSheet.Title className="font-nunitoBold text-xl text-foreground">
                Filters
              </BottomSheet.Title>
              <Button
                size="sm"
                variant="ghost"
                onPress={() => {
                  Keyboard.dismiss();
                  onChange({ apartmentId: null, month: currentMonth });
                  setSearch("");
                  setYear(Number(currentMonth.slice(0, 4)));
                }}
              >
                <Button.Label>Reset</Button.Label>
              </Button>
            </View>
            <BottomSheet.Description className="font-inter text-sm text-muted">
              Choose the property and month for your report.
            </BottomSheet.Description>
            <FinanceTabs
              value={tab}
              options={FILTER_TABS}
              onChange={(next) => {
                Keyboard.dismiss();
                setTab(next);
              }}
            />
            {tab === "property" && (
              <PropertySearch value={search} onChange={setSearch} />
            )}
          </View>

          <BottomSheetScrollView
            style={{ flex: 1 }}
            enableFooterMarginAdjustment
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            contentContainerStyle={{
              paddingHorizontal: 8,
              paddingBottom: insets.bottom + 16,
              gap: 8,
            }}
          >
            {tab === "property" ? (
              <>
                {propertyOptions.map((item) => (
                  <Button
                    key={item.id ?? "all"}
                    variant="ghost"
                    accessibilityRole="radio"
                    accessibilityState={{
                      checked: item.id === value.apartmentId,
                    }}
                    accessibilityLabel={`Property: ${item.name}`}
                    className={`h-auto min-h-12 py-3 justify-start${item.id === value.apartmentId ? " bg-primary-light" : ""}`}
                    onPress={() => onChange({ ...value, apartmentId: item.id })}
                  >
                    <Button.Label className={`flex-1${item.id === value.apartmentId ? " text-primary-light-foreground" : ""}`} numberOfLines={2}>
                      {item.name}
                    </Button.Label>
                    {item.id === value.apartmentId && (
                      <Text accessible={false} className="text-primary-light-foreground">
                        ✓
                      </Text>
                    )}
                  </Button>
                ))}
                {searchTerm && propertyOptions.length === 1 ? (
                  <Text className="py-4 font-inter text-sm text-muted">
                    No matching properties.
                  </Text>
                ) : null}
              </>
            ) : (
              <>
                <View className="flex-row items-center justify-between">
                  <Button
                    isIconOnly
                    variant="ghost"
                    accessibilityLabel="Previous year"
                    isDisabled={year <= Number(oldestMonth.slice(0, 4))}
                    onPress={() => setYear(year - 1)}
                  >
                    <IconChevronLeft size={28} color={colors.textPrimary} />
                  </Button>
                  <Text
                    accessibilityRole="header"
                    className="font-nunitoBold text-lg text-foreground"
                  >
                    {year}
                  </Text>
                  <Button
                    isIconOnly
                    variant="ghost"
                    accessibilityLabel="Next year"
                    isDisabled={year >= Number(currentMonth.slice(0, 4))}
                    onPress={() => setYear(year + 1)}
                  >
                    <IconChevronRight size={28} color={colors.textPrimary} />
                  </Button>
                </View>
                <View className="flex-row flex-wrap">
                  {Array.from({ length: 12 }, (_, index) => {
                    const month = `${year}-${String(index + 1).padStart(2, "0")}`;
                    const selected = month === value.month;
                    return (
                      <View key={month} className="w-1/3 p-1">
                        <Button
                          variant={selected ? "primary" : "tertiary"}
                          isDisabled={
                            month < oldestMonth || month > currentMonth
                          }
                          accessibilityLabel={`Month: ${financeMonthLabel(month)}`}
                          accessibilityRole="radio"
                          accessibilityState={{ checked: selected }}
                          onPress={() => onChange({ ...value, month })}
                        >
                          <Button.Label>
                            {financeMonthLabel(month).slice(0, 3)}
                          </Button.Label>
                        </Button>
                      </View>
                    );
                  })}
                </View>
                <Text className="font-inter text-xs text-muted">
                  Reports are available for the last {REPORT_MONTH_COUNT}{" "}
                  months.
                </Text>
              </>
            )}
          </BottomSheetScrollView>
        </BottomSheet.Content>
      </BottomSheet.Portal>
    </BottomSheet>
  );
}
