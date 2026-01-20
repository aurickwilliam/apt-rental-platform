import { View, Text, Pressable, Platform } from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";

import { COLORS } from "../../constants/colors";

interface DateTimeFieldProps {
  label?: string;
  placeholder?: string;
  value?: Date | null;
  onChange?: (date: Date) => void;
  disabled?: boolean;
  error?: string;
  required?: boolean;
}

export default function DateTimeField({
  label,
  placeholder = "Select date",
  value,
  onChange,
  disabled = false,
  error,
  required = false,
}: DateTimeFieldProps) {

  const [show, setShow] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const displayValue = value
    ? value.toISOString().split("T")[0]
    : placeholder;

  const handleChange = (_: any, selectedDate?: Date) => {
    if (Platform.OS === "android") {
      setShow(false);
      setIsFocused(false);
    }

    if (selectedDate) {
      onChange?.(selectedDate);
    }
  };

  const openDatePicker = () => {
    if (!disabled) {
      setShow(true);
      setIsFocused(true);
    }
  };

  return (
    <View className="w-full flex-col gap-2">
      {label && (
        <Text className="text-md text-text font-interMedium">
          {label} {required && <Text className="text-redHead-200">*</Text>}
        </Text>
      )}

      <View
        className={`bg-white border-2 rounded-2xl pl-2 pr-4 h-16 flex-row 
        items-center justify-between
        ${error ? "border-redHead-200" : isFocused ? "border-primary" : "border-grey-200"}`}
      >
        <Text
          className={`text-lg font-inter ${
            value ? "text-text" : "text-grey-300"
          }`}
        >
          {displayValue}
        </Text>

        <Pressable onPress={openDatePicker} disabled={disabled}>
          <Ionicons
            name="calendar-outline"
            size={24}
            color={COLORS.mediumGrey}
          />
        </Pressable>
      </View>

      {error && (
        <Text className="text-md text-redHead-200 font-inter mt-1">
          {error}
        </Text>
      )}

      {/* Date Picker */}
      {show && (
        <DateTimePicker
          value={value ?? new Date()}
          mode="date"
          display={"default"}
          onChange={handleChange}
        />
      )}
    </View>
  );
}
