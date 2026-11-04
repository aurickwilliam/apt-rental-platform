import { Text, View } from "react-native";
import { FieldError, Label, Radio, RadioGroup } from "heroui-native";

interface YesNoRadioFieldProps {
  label: string;
  /** undefined while unanswered, so neither option is preselected. */
  value: boolean | undefined;
  onChange: (value: boolean) => void;
  error?: string;
  required?: boolean;
}

/**
 * Yes/No question shared by the personalization step and the rental
 * application, so both ask their preference questions the same way.
 */
export default function YesNoRadioField({
  label,
  value,
  onChange,
  error,
  required = false,
}: YesNoRadioFieldProps) {
  return (
    <View className="flex gap-3">
      <Text className="text-foreground text-base font-nunitoSemiBold">
        {label}
        {required ? <Text className="text-danger"> *</Text> : null}
      </Text>

      <RadioGroup
        value={value === undefined ? "" : value ? "yes" : "no"}
        onValueChange={(next) => onChange(next === "yes")}
        isInvalid={!!error}
      >
        {[
          { key: "yes", text: "Yes" },
          { key: "no", text: "No" },
        ].map(({ key, text }) => (
          <RadioGroup.Item
            key={key}
            value={key}
            className="flex-row items-center justify-start gap-2"
          >
            <Radio>
              <Radio.Indicator className="border border-border shadow-none rounded-full" />
            </Radio>
            <Label>{text}</Label>
          </RadioGroup.Item>
        ))}
      </RadioGroup>

      {error ? <FieldError isInvalid>{error}</FieldError> : null}
    </View>
  );
}
