import { useCallback, useState } from "react";
import { Keyboard, View } from "react-native";
import {
  BottomSheetScrollView,
  type BottomSheetFooterProps,
} from "@gorhom/bottom-sheet";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BottomSheet, Button } from "heroui-native";
import type {
  FinanceProperty,
  FinanceScope,
  FinanceIncomeMonth,
} from "@/service/finance/financeService";
import FinanceTabs from "./FinanceTabs";
import PropertySearch from "./PropertySearch";
import FinanceFilterPropertyList from "./FinanceFilterPropertyList";
import FinanceFilterMonthGrid from "./FinanceFilterMonthGrid";
import FinanceFilterFooter from "./FinanceFilterFooter";

const FILTER_TABS = [
  { value: "property", label: "Property" },
  { value: "month", label: "Month" },
];

interface FinanceFilterSheetProps {
  isOpen: boolean;
  value: FinanceScope;
  currentMonth: string;
  properties: FinanceProperty[];
  incomeMonths?: FinanceIncomeMonth[];
  incomeMonthsLoading: boolean;
  incomeMonthsError: boolean;
  onRetryIncomeMonths: () => void;
  onChange: (value: FinanceScope) => void;
  onApply: () => void;
  onClose: () => void;
}

export default function FinanceFilterSheet({
  isOpen,
  value,
  currentMonth,
  properties,
  incomeMonths,
  incomeMonthsLoading,
  incomeMonthsError,
  onRetryIncomeMonths,
  onChange,
  onApply,
  onClose,
}: FinanceFilterSheetProps) {
  const insets = useSafeAreaInsets();
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
  const propertyName =
    properties.find((property) => property.id === value.apartmentId)?.name ??
    "All properties";
  const close = useCallback(() => {
    Keyboard.dismiss();
    onClose();
  }, [onClose]);
  const renderFooter = useCallback(
    (props: BottomSheetFooterProps) => (
      <FinanceFilterFooter
        {...props}
        bottomInset={insets.bottom}
        propertyName={propertyName}
        month={value.month}
        onClose={close}
        onApply={onApply}
      />
    ),
    [close, insets.bottom, onApply, propertyName, value.month],
  );

  // Keep one mounted root, content and scroll region across both filter tabs.
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
          <View className="gap-3 pb-3">
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
              paddingBottom: insets.bottom + 16,
              gap: 8,
            }}
          >
            {tab === "property" ? (
              <FinanceFilterPropertyList
                properties={properties}
                search={search}
                apartmentId={value.apartmentId}
                onChange={(apartmentId) => onChange({ ...value, apartmentId })}
              />
            ) : (
              <FinanceFilterMonthGrid
                year={year}
                onYearChange={setYear}
                month={value.month}
                currentMonth={currentMonth}
                incomeMonths={incomeMonths}
                incomeMonthsLoading={incomeMonthsLoading}
                incomeMonthsError={incomeMonthsError}
                onRetryIncomeMonths={onRetryIncomeMonths}
                onChange={(month) => onChange({ ...value, month })}
              />
            )}
          </BottomSheetScrollView>
        </BottomSheet.Content>
      </BottomSheet.Portal>
    </BottomSheet>
  );
}
