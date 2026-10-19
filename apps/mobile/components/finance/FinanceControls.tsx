import { useState, type ReactNode } from "react";
import { Keyboard, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BottomSheetScrollView } from "@gorhom/bottom-sheet";
import { Button, Select, Tabs } from "heroui-native";
import { formatPesoDisplay } from "@repo/utils";
import PropertySearch from "./PropertySearch";
import { useColors } from "@/hooks/useTheme";

export function FinanceCard({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <View
      className={`bg-surface border border-border rounded-3xl p-4 gap-4${className ? ` ${className}` : ""}`}
    >
      {children}
    </View>
  );
}

export function FinanceHeading({
  title,
  description,
  action,
  titleClassName,
  descriptionClassName,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  titleClassName?: string;
  descriptionClassName?: string;
}) {
  return (
    <View className="flex-row items-start justify-between gap-3">
      <View className="flex-1 gap-1">
        <Text
          accessibilityRole="header"
          className={`font-nunitoBold text-lg text-foreground${titleClassName ? ` ${titleClassName}` : ""}`}
        >
          {title}
        </Text>
        {description && (
          <Text
            className={`font-inter text-xs text-muted leading-5${descriptionClassName ? ` ${descriptionClassName}` : ""}`}
          >
            {description}
          </Text>
        )}
      </View>
      {action}
    </View>
  );
}

export function MoneyRow({
  label,
  amount,
  emphasized = false,
}: {
  label: string;
  amount: number | null;
  emphasized?: boolean;
}) {
  return (
    <View className="flex-row justify-between items-start gap-3">
      <Text className="font-inter text-sm text-muted flex-1">{label}</Text>
      <Text
        selectable
        className={`${emphasized ? "font-nunitoBold text-accent" : "font-nunitoSemiBold text-foreground"} text-sm`}
        style={{ fontVariant: ["tabular-nums"] }}
      >
        {amount === null ? "Not calculated" : formatPesoDisplay(amount)}
      </Text>
    </View>
  );
}

export function FinanceSelect({
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
  const visibleOptions = searchable ? options.filter((option) => option.label.toLocaleLowerCase().includes(term)) : options;
  return (
    <View className="gap-2 min-w-0">
      <Text className={`font-nunitoSemiBold text-sm ${error ? "text-danger" : "text-muted"}`}>{label}{required && <Text className="text-danger"> *</Text>}</Text>
      <Select
        presentation="bottom-sheet"
        onOpenChange={(open) => { if (searchable) { Keyboard.dismiss(); if (open) setSearch(""); } }}
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
          style={error ? { borderColor: colors.danger, borderWidth: 2 } : undefined}
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
            // Category and Plan type sheets size to their options so the whole
            // list is visible on open; property search and fixed-height sheets
            // keep their own snap points.
            snapPoints={
              sheetHeight ? [sheetHeight] : searchable ? ["90%"] : undefined
            }
            enableDynamicSizing={!sheetHeight && !searchable}
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
            <Select.ListLabel className="font-nunitoBold text-lg text-foreground px-5 pb-3">
              {label}
            </Select.ListLabel>
            {searchable && <View className="px-3 pb-3"><PropertySearch value={search} onChange={setSearch} /></View>}
            <BottomSheetScrollView
              style={searchable ? { flex: 1 } : undefined}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode={searchable ? "on-drag" : undefined}
              contentContainerStyle={{ padding: 12, paddingBottom: 40 }}
            >
              {visibleOptions.map((option) => (
                <Select.Item
                  key={option.value}
                  value={option.value}
                  label={option.label}
                  className={highlightSelected && option.value === value ? "bg-primary-light rounded-full" : undefined}
                >
                  <Select.ItemLabel className={highlightSelected && option.value === value ? "text-primary-light-foreground" : undefined} />
                  <Select.ItemIndicator />
                </Select.Item>
              ))}
              {searchable && visibleOptions.length === 0 && <Text className="py-4 font-inter text-sm text-muted">No matching properties.</Text>}
            </BottomSheetScrollView>
          </Select.Content>
        </Select.Portal>
      </Select>
      {error && <Text accessibilityRole="alert" className="font-inter text-sm text-danger">{error}</Text>}
    </View>
  );
}

export function FinanceTabs({
  value,
  options,
  onChange,
}: {
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
}) {
  return (
    <Tabs value={value} onValueChange={onChange} variant="primary">
      <Tabs.List>
        <Tabs.Indicator />
        {options.map((option) => (
          <Tabs.Trigger
            key={option.value}
            value={option.value}
            className="flex-1"
          >
            <Tabs.Label>{option.label}</Tabs.Label>
          </Tabs.Trigger>
        ))}
      </Tabs.List>
    </Tabs>
  );
}

export function FinanceError({
  onRetry,
  message = "We couldn’t load this information.",
}: {
  onRetry: () => void;
  message?: string;
}) {
  return (
    <View className="gap-3 py-3">
      <Text
        accessibilityRole="alert"
        selectable
        className="font-inter text-sm text-danger"
      >
        {message}
      </Text>
      <Button variant="secondary" onPress={onRetry}>
        <Button.Label>Try again</Button.Label>
      </Button>
    </View>
  );
}
