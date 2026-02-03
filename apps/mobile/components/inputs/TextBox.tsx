import { View, Text, TextInput } from 'react-native'
import { useState } from 'react';

import { COLORS } from '../../constants/colors';

interface TextBoxProps {
  label?: string,
  placeholder?: string,
  onChangeText?: (text: string) => void,
  value?: string,
  disabled?: boolean,
  error?: string,
  required?: boolean,
}

export default function TextBox({
    label,
    placeholder,
    onChangeText,
    value,
    disabled = false,
    error,
    required = false
}: TextBoxProps) {
  const [isFocused, setIsFocused] = useState<boolean>(false);

  return (
    <View className='w-full flex-col gap-2'>
      {/* Label Text */}
      {
        label &&
        <Text className='text-md text-text font-interMedium'>
          {label} {required && <Text className='text-redHead-200'>*</Text>}
        </Text>
      }

      {/* Text Input Area */}
      <View className={`bg-white border-2 rounded-2xl p-2 h-52 flex-row items-center
        ${error ? 'border-redHead-200' : isFocused ? 'border-primary' : 'border-grey-200'}`
      }>
        <TextInput
          value={value}
          editable={!disabled}
          onChangeText={onChangeText}
          multiline={true}
          scrollEnabled={true}

          style={{
            flex: 1,
            height: '100%',
            color: disabled ? COLORS.mediumGrey : COLORS.text,
            textAlignVertical: 'top',

            fontFamily: 'Inter_24pt-Regular',
            fontSize: 16,
            lineHeight: 20,
          }}
          placeholder={placeholder}
          placeholderTextColor={COLORS.mediumGrey}

          onFocus={() => {
            setIsFocused(true);
          }}
          // When the user taps out of the input field
          onBlur={() => {
            setIsFocused(false);
          }}
        />
      </View>

      {/* Error Message */}
      {error && (
        <Text className='text-redHead-200 text-md font-inter mt-1'>
          {error}
        </Text>
      )}
    </View>
  )
}