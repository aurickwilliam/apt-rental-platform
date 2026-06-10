import { View, Text, Pressable, Platform, Modal } from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";

import { COLORS } from "@repo/constants";

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
  const [tempDate, setTempDate] = useState<Date>(value ?? new Date());

  const formatDate = (date: Date) => {
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const year = date.getFullYear();

    return `${month}/${day}/${year}`;
  };

  const displayValue = value ? formatDate(value) : placeholder;

  const handleChange = (_: any, selectedDate?: Date) => {
    if (Platform.OS === "android") {
      setShow(false);
      setIsFocused(false);
      if (selectedDate) onChange?.(selectedDate);
      return;
    }
    // iOS: stage into tempDate, commit on Done
    if (selectedDate) setTempDate(selectedDate);
  };

  const openDatePicker = () => {
    if (!disabled) {
      setTempDate(value ?? new Date());
      setShow(true);
      setIsFocused(true);
    }
  };

  const handleDone = () => {
    onChange?.(tempDate);
    setShow(false);
    setIsFocused(false);
  };

  const handleCancel = () => {
    setShow(false);
    setIsFocused(false);
  };

  return (
    <View className="w-full flex-col gap-2">
      {label && (
        <Text className={`text-base font-interMedium ${error ? 'text-redHead-200' : 'text-text'}`}>
          {label} {required && <Text className="text-redHead-200">*</Text>}
        </Text>
      )}

      <Pressable
        onPress={openDatePicker}
        disabled={disabled}
        style={{ justifyContent: "space-between" }}
        className={`bg-white border-2 rounded-2xl pl-3 pr-4 h-12 flex-row 
          items-center justify-between
          ${error ? "border-redHead-200" : isFocused ? "border-primary" : "border-grey-200"}`}
      >
        <Text className={`font-inter ${value ? "text-text" : "text-grey-500"}`}>
          {displayValue}
        </Text>
        <Ionicons name="calendar-outline" size={24} color={COLORS.mediumGrey} />
      </Pressable>

      {error && (
        <Text className="text-md text-redHead-200 font-inter">{error}</Text>
      )}

      {/* iOS Modal */}
      {Platform.OS === "ios" && (
        <Modal
          visible={show}
          transparent
          animationType="fade"
          onRequestClose={handleCancel}
        >
          {/* Backdrop */}
          <Pressable
            onPress={handleCancel}
            style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.3)" }}
          />

          {/* Sheet */}
          <View className="bg-white rounded-t-3xl pb-8">
            {/* Toolbar */}
            <View className="flex-row justify-between items-center px-4 pt-4 pb-2 border-b border-grey-200">
              <Pressable onPress={handleCancel} className="py-1 px-2">
                <Text className="text-base text-grey-500 font-inter">Cancel</Text>
              </Pressable>
              <Text className="text-base font-interMedium text-text">
                {label ?? "Select Date"}
              </Text>
              <Pressable onPress={handleDone} className="py-1 px-2">
                <Text className="text-base text-primary font-interMedium">Done</Text>
              </Pressable>
            </View>

            {/* Picker */}
            <DateTimePicker
              value={tempDate}
              mode="date"
              display="spinner"
              onChange={handleChange}
              style={{ height: 200, alignSelf: "center" }}
            />
          </View>
        </Modal>
      )}

      {/* Android inline picker */}
      {Platform.OS === "android" && show && (
        <DateTimePicker
          value={value ?? new Date()}
          mode="date"
          display="default"
          onChange={handleChange}
        />
      )}
    </View>
  );
}