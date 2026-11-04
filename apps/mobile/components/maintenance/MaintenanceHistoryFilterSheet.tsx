import { useState } from "react";
import { Text, View } from "react-native";
import { ScrollView as GestureScrollView } from "react-native-gesture-handler";
import { BottomSheetScrollView } from "@gorhom/bottom-sheet";
import { BottomSheet, Button, Select } from "heroui-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MAINTENANCE_CATEGORIES, MAINTENANCE_URGENCY } from "@repo/constants";
import { emptyHistoryFilters, HISTORY_DATE_OPTIONS, type MaintenanceHistoryFilters } from "@/utils/maintenance-history-filters";

interface MaintenanceHistoryFilterSheetProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  filters: MaintenanceHistoryFilters;
  onApply: (filters: MaintenanceHistoryFilters) => void;
}

export default function MaintenanceHistoryFilterSheet({ isOpen, onOpenChange, filters, onApply }: MaintenanceHistoryFilterSheetProps) {
  const insets = useSafeAreaInsets();
  const [draft, setDraft] = useState(filters);
  const [wasOpen, setWasOpen] = useState(isOpen);
  const [openField, setOpenField] = useState<"category" | "date" | null>(null);
  if (wasOpen !== isOpen) {
    setWasOpen(isOpen);
    setOpenField(null);
    if (isOpen) setDraft(filters);
  }
  const groups = [
    { key: "statuses" as const, title: "Status", options: [{ value: "Resolved", label: "Resolved" }, { value: "Cancelled", label: "Cancelled" }] },
    { key: "urgencies" as const, title: "Urgency", options: MAINTENANCE_URGENCY },
  ];
  const toggle = (key: "statuses" | "urgencies", value: string) => {
    setDraft((previous) => ({ ...previous, [key]: previous[key].includes(value)
      ? previous[key].filter((item) => item !== value) : [...previous[key], value] }));
  };
  return (
    <BottomSheet isOpen={isOpen} onOpenChange={onOpenChange}>
      <BottomSheet.Portal>
        <BottomSheet.Overlay />
        <BottomSheet.Content snapPoints={["85%"]} enableDynamicSizing={false} topInset={insets.top}
          enableContentPanningGesture={openField !== "category"}>
          <View className="gap-2 pb-4">
            <BottomSheet.Title className="font-nunitoBold text-xl text-foreground">Filter maintenance history</BottomSheet.Title>
            <BottomSheet.Description className="font-inter text-sm text-muted">Choose filters, then apply them to your history.</BottomSheet.Description>
          </View>
          <BottomSheetScrollView scrollEnabled={openField !== "category"} contentContainerStyle={{ gap: 20, paddingBottom: 16 }}>
            {groups.map(({ key, title, options }) => (
              <View key={key} className="gap-3">
                <Text accessibilityRole="header" className="font-nunitoSemiBold text-base text-foreground">{title}</Text>
                <View className="flex-row flex-wrap gap-2">
                  {options.map((option) => (
                    <Button key={option.value} size="sm" className="min-h-11" variant={draft[key].includes(option.value) ? "secondary" : "outline"}
                      accessibilityRole="checkbox" accessibilityState={{ checked: draft[key].includes(option.value) }}
                      accessibilityLabel={`${title}: ${option.label}`} onPress={() => toggle(key, option.value)}>
                      <Button.Label>{option.label}</Button.Label>
                    </Button>
                  ))}
                </View>
              </View>
            ))}
            <View className="gap-2">
              <Text className="font-nunitoSemiBold text-base text-foreground">Category</Text>
              <Select selectionMode="multiple" presentation="popover"
                isOpen={isOpen && openField === "category"} onOpenChange={(open) => setOpenField(open ? "category" : null)}
                value={MAINTENANCE_CATEGORIES.filter((option) => draft.categories.includes(option.value))}
                onValueChange={(options) => setDraft((previous) => ({ ...previous, categories: options.flatMap((option) => option ? [option.value] : []) }))}>
                <Select.Trigger accessibilityLabel="Category" className="min-h-12 rounded-2xl border border-field-border bg-surface">
                  <Select.Value placeholder="All categories" numberOfLines={1} className="min-w-0 flex-1" />
                  <Select.TriggerIndicator />
                </Select.Trigger>
                <Select.Portal>
                  <Select.Overlay />
                  <Select.Content presentation="popover" placement="bottom" align="start" width="trigger">
                    {/* Let the menu own swipes rather than the enclosing sheet's pan gesture. */}
                    <GestureScrollView style={{ maxHeight: 260 }} nestedScrollEnabled disallowInterruption keyboardShouldPersistTaps="handled">
                      {MAINTENANCE_CATEGORIES.map((option) => (
                        <Select.Item key={option.value} value={option.value} label={option.label} closeOnPress={false} accessibilityLabel={`Category: ${option.label}`}>
                          <Select.ItemLabel /><Select.ItemIndicator />
                        </Select.Item>
                      ))}
                    </GestureScrollView>
                  </Select.Content>
                </Select.Portal>
              </Select>
            </View>
            <View className="gap-2">
              <Text className="font-nunitoSemiBold text-base text-foreground">Reported date</Text>
              <Select presentation="popover"
                isOpen={isOpen && openField === "date"} onOpenChange={(open) => setOpenField(open ? "date" : null)}
                value={HISTORY_DATE_OPTIONS.find((option) => option.value === draft.reportedDate)}
                onValueChange={(option) => setDraft((previous) => ({ ...previous, reportedDate: HISTORY_DATE_OPTIONS.find((item) => item.value === option?.value)?.value ?? "any" }))}>
                <Select.Trigger accessibilityLabel="Reported date" className="min-h-12 rounded-2xl border border-field-border bg-surface">
                  <Select.Value placeholder="Any time" numberOfLines={1} className="min-w-0 flex-1" />
                  <Select.TriggerIndicator />
                </Select.Trigger>
                <Select.Portal>
                  <Select.Overlay />
                  <Select.Content presentation="popover" placement="bottom" align="start" width="trigger">
                    {HISTORY_DATE_OPTIONS.map((option) => (
                      <Select.Item key={option.value} value={option.value} label={option.label} accessibilityLabel={`Reported date: ${option.label}`}>
                        <Select.ItemLabel /><Select.ItemIndicator />
                      </Select.Item>
                    ))}
                  </Select.Content>
                </Select.Portal>
              </Select>
            </View>
          </BottomSheetScrollView>
          <View className="flex-row gap-3 border-t border-border pt-3" style={{ paddingBottom: insets.bottom + 12 }}>
            <Button variant="outline" className="flex-1" onPress={() => setDraft(emptyHistoryFilters())}><Button.Label>Reset</Button.Label></Button>
            <Button className="flex-1" onPress={() => { onApply(draft); onOpenChange(false); }}><Button.Label>Apply filters</Button.Label></Button>
          </View>
        </BottomSheet.Content>
      </BottomSheet.Portal>
    </BottomSheet>
  );
}
