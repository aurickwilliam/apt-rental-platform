import { View, Text } from "react-native";
import { Select, Label, Separator } from "heroui-native";

type Period = "AM" | "PM";

type Props = {
  label: string;
  hour: string;
  period: Period;
  onHourChange: (hour: string) => void;
  onPeriodChange: (period: Period) => void;
  required?: boolean;
  isInvalid?: boolean;
};

const HOURS = Array.from({ length: 12 }, (_, i) => {
  const h = String(i + 1).padStart(2, "0");
  return { value: h, label: `${h}:00` };
});

const PERIODS: { value: Period; label: string }[] = [
  { value: "AM", label: "AM" },
  { value: "PM", label: "PM" },
];

function TimeSelect<T extends string>({
  value,
  placeholder,
  options,
  sheetLabel,
  onValueChange,
  isInvalid,
}: {
  value: T | "";
  placeholder: string;
  options: { value: T; label: string }[];
  sheetLabel: string;
  onValueChange: (v: T) => void;
  isInvalid?: boolean;
}) {
  return (
    <Select
      presentation="bottom-sheet"
      value={value ? { value, label: value } : undefined}
      onValueChange={(option) => {
        if (option && !Array.isArray(option)) {
          onValueChange(option.value as T);
        }
      }}
    >
      <Select.Trigger
        className={`shadow-none bg-surface border ${isInvalid ? "border-danger" : "border-field-border"}`}
      >
        <Select.Value placeholder={placeholder} />
        <Select.TriggerIndicator />
      </Select.Trigger>
      <Select.Portal>
        <Select.Overlay />
        <Select.Content
          presentation="bottom-sheet"
          snapPoints={["50%"]}
          contentContainerClassName="px-4 pt-4 pb-10"
        >
          <Select.ListLabel className="text-base text-foreground text-center font-interMedium pb-3 mb-2">
            {sheetLabel}
          </Select.ListLabel>
          {options.map((opt, i) => (
            <View key={opt.value}>
              <Select.Item value={opt.value} label={opt.label} />
              {i < options.length - 1 && <Separator />}
            </View>
          ))}
        </Select.Content>
      </Select.Portal>
    </Select>
  );
}

export default function TimeField({
  label,
  hour,
  period,
  onHourChange,
  onPeriodChange,
  required = false,
  isInvalid = false,
}: Props) {
  return (
    <View className="gap-2">
      <View className="flex-row items-center gap-1">
        <Label className={isInvalid ? "text-danger" : ""}>{label}</Label>
        {required && <Text className="text-danger">*</Text>}
      </View>
      <View className="flex-row gap-3">
        <View className="flex-1">
          <TimeSelect
            value={hour}
            placeholder="Hour"
            options={HOURS}
            sheetLabel="Select Hour"
            onValueChange={onHourChange}
            isInvalid={isInvalid && !hour}
          />
        </View>
        <View className="flex-1">
          <TimeSelect
            value={period}
            placeholder="AM/PM"
            options={PERIODS}
            sheetLabel="Select Period"
            onValueChange={onPeriodChange}
          />
        </View>
      </View>
    </View>
  );
}
