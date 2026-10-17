import type { ReactNode } from "react";
import { Text, View } from "react-native";
import { BottomSheetScrollView } from "@gorhom/bottom-sheet";
import { Button, Select, Tabs } from "heroui-native";
import { formatPesoDisplay } from "@repo/utils";

export function FinanceCard({ children }: { children: ReactNode }) {
  return (
    <View className="bg-surface border border-border rounded-3xl p-4 gap-4">
      {children}
    </View>
  );
}

export function FinanceHeading({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <View className="flex-row items-start justify-between gap-3">
      <View className="flex-1 gap-1">
        <Text
          accessibilityRole="header"
          className="font-nunitoBold text-lg text-foreground"
        >
          {title}
        </Text>
        {description && (
          <Text className="font-inter text-xs text-muted leading-5">
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
}: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
  disabled?: boolean;
}) {
  return (
    <View className="gap-2 min-w-0">
      <Text className="font-nunitoSemiBold text-sm text-muted">{label}</Text>
      <Select
        presentation="bottom-sheet"
        value={options.find((option) => option.value === value)}
        onValueChange={(option) => {
          if (option && !Array.isArray(option)) onChange(option.value);
        }}
      >
        <Select.Trigger
          isDisabled={disabled}
          accessibilityLabel={label}
          className="bg-surface border border-field-border rounded-2xl shadow-none focus:border-focus data-[open=true]:border-focus"
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
          <Select.Content presentation="bottom-sheet" snapPoints={["65%"]}>
            <Select.ListLabel className="font-nunitoBold text-lg text-foreground px-5 pb-3">
              {label}
            </Select.ListLabel>
            <BottomSheetScrollView
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={{ padding: 12, paddingBottom: 40 }}
            >
              {options.map((option) => (
                <Select.Item
                  key={option.value}
                  value={option.value}
                  label={option.label}
                />
              ))}
            </BottomSheetScrollView>
          </Select.Content>
        </Select.Portal>
      </Select>
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
