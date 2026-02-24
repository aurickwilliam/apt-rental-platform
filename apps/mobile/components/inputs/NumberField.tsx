import { View, Text, TextInput, Platform } from 'react-native'
import { useState } from 'react'

import { COLORS } from '@repo/constants';

interface NumberFieldProps {
  label?: string;
  placeholder?: string;
  onChange?: (text: string) => void;
  value?: string;
  disabled?: boolean;
  error?: string;
  required?: boolean;
  maxLength?: number;    
  allowDecimal?: boolean;
  onBlur?: () => void;
}

export default function NumberField({
    label,
    placeholder,
    onChange,
    value,
    disabled = false,
    error,
    required = false,
    maxLength,
    allowDecimal = false,
    onBlur,
  }: NumberFieldProps) {

  const [isFocused, setIsFocused] = useState<boolean>(false);

  const handleChange = (text: string) => {
    let filtered = text;

    if (allowDecimal) {
      // Allow digits + one decimal
      filtered = filtered.replace(/[^0-9.]/g, "");
      const parts = filtered.split(".");
      if (parts.length > 2) {
        filtered = parts[0] + "." + parts.slice(1).join("");
      }

      // Optional: limit to 2 decimal places
      if (filtered.includes(".")) {
        const [int, dec] = filtered.split(".");
        filtered = dec.length > 2 ? `${int}.${dec.slice(0, 2)}` : filtered;
      }
    } else {
      // Digits only
      filtered = filtered.replace(/[^0-9]/g, "");
    }

    if (maxLength && filtered.length > maxLength) {
      filtered = filtered.slice(0, maxLength);
    }

    onChange?.(filtered);
  };


  return (
    <View className='w-full flex-col gap-2'>
      {/* Label Text */}
      {
        label &&
        <Text className='text-base text-text font-interMedium'>
          {label} {required && <Text className='text-redHead-200'>*</Text>}
        </Text>
      }
      {/* Number Input Area */}
      <View className={`bg-white border-2 rounded-2xl pl-2 pr-4 h-16 flex-row items-center
        ${error ? 'border-redHead-200' : isFocused ? 'border-primary' : 'border-grey-200'}`
      }>
        <TextInput
          value={value}
          numberOfLines={1}
          keyboardType={
            allowDecimal ? "decimal-pad" :
            Platform.OS === "ios" ? "number-pad" : "numeric"
          }
          editable={!disabled}
          onChangeText={handleChange}
          placeholder={placeholder}
          placeholderTextColor={COLORS.lightGrey}
          style={{
            flex: 1,
            height: '100%',
            paddingVertical: 0,
            color: disabled ? COLORS.mediumGrey : COLORS.text,

            fontFamily: 'Inter_24pt-Regular',
            fontSize: 16,
            lineHeight: 20,
          }}
          onFocus={() => setIsFocused(true)}
          onBlur={() => {
            setIsFocused(false);
            onBlur?.();
          }}
        />
      </View>

      {/* Error Message */}
      {
        error &&
        <Text className='text-base text-redHead-200 font-inter mt-1'>
          {error}
        </Text>
      }
    </View>
  )
}