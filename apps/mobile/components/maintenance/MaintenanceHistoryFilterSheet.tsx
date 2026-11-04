import { useState } from "react";
import { Text, View } from "react-native";
import { BottomSheetScrollView } from "@gorhom/bottom-sheet";
import { BottomSheet, Button } from "heroui-native";
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
  if (wasOpen !== isOpen) {
    setWasOpen(isOpen);
    if (isOpen) setDraft(filters);
  }
  const groups = [
    { key: "statuses" as const, title: "Status", options: [{ value: "Resolved", label: "Resolved" }, { value: "Cancelled", label: "Cancelled" }] },
    { key: "urgencies" as const, title: "Urgency", options: MAINTENANCE_URGENCY },
    { key: "categories" as const, title: "Category", options: MAINTENANCE_CATEGORIES },
  ];
  const toggle = (key: "statuses" | "urgencies" | "categories", value: string) => {
    setDraft((previous) => ({ ...previous, [key]: previous[key].includes(value)
      ? previous[key].filter((item) => item !== value) : [...previous[key], value] }));
  };
  return (
    <BottomSheet isOpen={isOpen} onOpenChange={onOpenChange}>
      <BottomSheet.Portal>
        <BottomSheet.Overlay />
        <BottomSheet.Content snapPoints={["85%"]} enableDynamicSizing={false} topInset={insets.top}>
          <View className="gap-2 pb-4">
            <BottomSheet.Title className="font-nunitoBold text-xl text-foreground">Filter maintenance history</BottomSheet.Title>
            <BottomSheet.Description className="font-inter text-sm text-muted">Choose filters, then apply them to your history.</BottomSheet.Description>
            <Button variant="ghost" size="sm" className="min-h-11 self-end" onPress={() => onOpenChange(false)}><Button.Label>Close filters</Button.Label></Button>
          </View>
          <BottomSheetScrollView contentContainerStyle={{ gap: 20, paddingBottom: 16 }}>
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
            <View className="gap-3">
              <Text accessibilityRole="header" className="font-nunitoSemiBold text-base text-foreground">Reported date</Text>
              <View className="gap-2" accessibilityRole="radiogroup">
                {[HISTORY_DATE_OPTIONS.slice(0, 2), HISTORY_DATE_OPTIONS.slice(2)].map((options) => (
                  <View key={options[0].value} style={{ flexDirection: "row", gap: 8 }}>
                    {options.map((option) => (
                      <Button key={option.value} size="sm" className="h-auto min-h-11 py-3" style={{ flexShrink: 0, alignSelf: "flex-start" }} variant={draft.reportedDate === option.value ? "secondary" : "outline"}
                        accessibilityRole="radio" accessibilityLabel={`Reported date: ${option.label}`} accessibilityState={{ checked: draft.reportedDate === option.value }} onPress={() => setDraft((previous) => ({ ...previous, reportedDate: option.value }))}>
                        <Button.Label numberOfLines={1} style={{ flexShrink: 0 }} className="text-center">{option.label}</Button.Label>
                      </Button>
                    ))}
                  </View>
                ))}
              </View>
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
