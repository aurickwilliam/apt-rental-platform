import { View, Text, Pressable, Platform, Modal } from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useState } from "react";

import { Calendar } from "lucide-react-native";

import { useColors } from "hooks/useTheme"

interface DateFieldProps {
  label?: string;
  placeholder?: string;
  value?: Date | null;
  onChange?: (date: Date) => void;
  disabled?: boolean;
  error?: string;
  required?: boolean;
  readOnly?: boolean;
}

export default function DateField({
  label,
  placeholder = "Select date",
  value,
  onChange,
  disabled = false,
  error,
  required = false,
  readOnly = false,
}: DateFieldProps) {
  const { colors } = useColors();

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
    if (!disabled && !readOnly) {
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
        <Text
          className={`text-base font-interMedium ${error ? "text-danger" : "text-foreground"}`}
        >
          {label} {required && <Text className="text-danger">*</Text>}
        </Text>
      )}

      <Pressable
        onPress={openDatePicker}
        disabled={disabled}
        style={{ justifyContent: "space-between" }}
        className={`border rounded-2xl pl-3 pr-4 h-12 flex-row items-center justify-between
          ${disabled
            ? 'bg-surface-tertiary border-field-border'
            : error
            ? 'bg-surface border-danger'
            : isFocused
            ? 'bg-surface border-accent'
            : 'bg-surface border-field-border'
          }`}
      >
        <Text
          className={`font-inter ${value ? "text-foreground" : "text-gray-500"}`}
        >
          {displayValue}
        </Text>

        {!readOnly && <Calendar size={20} color={colors.gray400} />}
      </Pressable>

      {error && <Text className="text-md text-danger font-inter">{error}</Text>}

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
          <View className="bg-surface-secondary rounded-t-3xl pb-8">
            {/* Toolbar */}
            <View className="flex-row justify-between items-center px-4 pt-4 pb-2 border-b border-field-border">
              <Pressable onPress={handleCancel} className="py-1 px-2">
                <Text className="text-base text-gray-500 font-inter">
                  Cancel
                </Text>
              </Pressable>
              <Text className="text-base font-interMedium text-foreground">
                {label ?? "Select Date"}
              </Text>
              <Pressable onPress={handleDone} className="py-1 px-2">
                <Text className="text-base text-accent font-interMedium">
                  Done
                </Text>
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
