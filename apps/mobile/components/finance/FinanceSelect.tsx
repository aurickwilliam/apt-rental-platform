import { useState } from "react";
import { Keyboard, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BottomSheetScrollView } from "@gorhom/bottom-sheet";
import { Select } from "heroui-native";
import PropertySearch from "./PropertySearch";
import { useColors } from "@/hooks/useTheme";

/**
 * Extra horizontal inset for the finance option sheets, on top of HeroUI's
 * shared 20px sheet gutter. The sheet label, the search field and the option
 * list share it so they stay aligned — keep it in sync with their `px-3`.
 */
const OPTION_LIST_HORIZONTAL_PADDING = 12;

export default function FinanceSelect({
  label,
  value,
  options,
  onChange,
  disabled = false,
  searchable = false,
  highlightSelection = false,
  sheetHeight,
  required = false,
  error,
}: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
  disabled?: boolean;
  searchable?: boolean;
  highlightSelection?: boolean;
  sheetHeight?: `${number}%`;
  required?: boolean;
  error?: string;
}) {
  const [search, setSearch] = useState("");
  const insets = useSafeAreaInsets();
  const { colors } = useColors();
  const highlightSelected = searchable || highlightSelection;
  const term = search.trim().toLocaleLowerCase();
  const visibleOptions = searchable
    ? options.filter((option) =>
        option.label.toLocaleLowerCase().includes(term),
      )
    : options;
  return (
    <View className="gap-2 min-w-0">
      <Text
        className={`font-nunitoSemiBold text-base ${error ? "text-danger" : "text-foreground"}`}
      >
        {label}
        {required && <Text className="text-danger"> *</Text>}
      </Text>
      <Select
        presentation="bottom-sheet"
        onOpenChange={(open) => {
          if (searchable) {
            Keyboard.dismiss();
            if (open) setSearch("");
          }
        }}
        value={options.find((option) => option.value === value)}
        onValueChange={(option) => {
          if (option && !Array.isArray(option)) {
            if (searchable) Keyboard.dismiss();
            onChange(option.value);
          }
        }}
      >
        <Select.Trigger
          isDisabled={disabled}
          accessibilityLabel={label}
          accessibilityHint={error ?? (required ? "Required field" : undefined)}
          style={
            error ? { borderColor: colors.danger, borderWidth: 2 } : undefined
          }
          className={`bg-surface border rounded-2xl shadow-none focus:border-focus data-[open=true]:border-focus ${error ? "finance-field-invalid border-danger" : "border-field-border"}`}
        >
          <Select.Value
            numberOfLines={1}
            className="flex-1"
            placeholder={`Choose ${label.toLowerCase()}`}
          />
          <Select.TriggerIndicator />
        </Select.Trigger>
        <Select.Portal>
          <Select.Overlay />
          <Select.Content
            presentation="bottom-sheet"
            // Always name a height: gorhom only builds the content-sized detent
            // after layout is measured, so a sheet that opens before that detent
            // exists settles short and clips its last option. Short lists pass
            // `sheetHeight` (Plan type, Expense treatment); the rest open tall
            // enough for a full category list and scroll past it.
            snapPoints={[sheetHeight ?? (searchable ? "90%" : "85%")]}
            enableDynamicSizing={false}
            {...(searchable
              ? {
                  enableOverDrag: false,
                  contentContainerClassName: "h-full",
                  topInset: insets.top,
                  keyboardBehavior: "fillParent" as const,
                  keyboardBlurBehavior: "restore" as const,
                  enableBlurKeyboardOnGesture: true,
                }
              : {})}
          >
            <Select.ListLabel className="font-nunitoBold text-lg text-foreground px-3 pb-3">
              {label}
            </Select.ListLabel>
            {searchable && (
              <View className="px-3 pb-3">
                <PropertySearch value={search} onChange={setSearch} />
              </View>
            )}
            <BottomSheetScrollView
              style={searchable ? { flex: 1 } : undefined}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode={searchable ? "on-drag" : undefined}
              contentContainerStyle={{
                // The sheet container already pads 20px; the extra inset keeps the
                // option pills off the sheet edges and lines the option text up
                // with the label and the search field above it.
                paddingHorizontal: OPTION_LIST_HORIZONTAL_PADDING,
                paddingBottom: insets.bottom + 24,
              }}
            >
              {visibleOptions.map((option) => (
                <Select.Item
                  key={option.value}
                  value={option.value}
                  label={option.label}
                  className={
                    highlightSelected && option.value === value
                      ? "bg-primary-light rounded-full px-3 py-2"
                      : undefined
                  }
                >
                  <Select.ItemLabel
                    className={
                      highlightSelected && option.value === value
                        ? "text-primary-light-foreground"
                        : undefined
                    }
                  />
                  <Select.ItemIndicator />
                </Select.Item>
              ))}
              {searchable && visibleOptions.length === 0 && (
                <Text className="px-2 py-4 font-inter text-sm text-muted">
                  No matching properties.
                </Text>
              )}
            </BottomSheetScrollView>
          </Select.Content>
        </Select.Portal>
      </Select>
      {error && (
        <Text
          accessibilityRole="alert"
          className="font-inter text-sm text-danger"
        >
          {error}
        </Text>
      )}
    </View>
  );
}
