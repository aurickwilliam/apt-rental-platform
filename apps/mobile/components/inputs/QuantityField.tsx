import { View, Text } from "react-native";
import { Slider, Label } from "heroui-native";

type Props = {
  label: string;
  value: number;
  onChange: (value: number) => void;
  minValue?: number;
  maxValue?: number;
  step?: number;
  unit?: [string, string]; // [singular, plural]
  required?: boolean;
};

export default function QuantityField({
  label,
  value,
  onChange,
  minValue = 1,
  maxValue = 10,
  step = 1,
  unit = ["item", "items"],
  required = false,
}: Props) {
  return (
    <Slider
      value={value}
      onChange={(v) => onChange(v as number)}
      minValue={minValue}
      maxValue={maxValue}
      step={step}
    >
      <View className="flex-row items-center justify-between mb-2">
        <View className="flex-row items-center gap-1">
          <Label>{label}</Label>
          {required && <Text className="text-danger">*</Text>}
        </View>
        <Slider.Output>
          {({ state }) => (
            <Text className="text-foreground font-interMedium text-base">
              {state.values[0]} {state.values[0] === 1 ? unit[0] : unit[1]}
            </Text>
          )}
        </Slider.Output>
      </View>
      <Slider.Track>
        <Slider.Fill />
        <Slider.Thumb />
      </Slider.Track>
    </Slider>
  );
}