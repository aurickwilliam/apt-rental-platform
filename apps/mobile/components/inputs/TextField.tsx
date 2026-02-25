import { View, Text, TextInput, TouchableOpacity } from 'react-native'
import { useState } from 'react'
import { Ionicons } from '@expo/vector-icons'

import { COLORS } from '@repo/constants';

interface TextFieldProps {
  label?: string,
  placeholder?: string,
  onChangeText?: (text: string) => void,
  value?: string,
  isPassword?: boolean,
  disabled?: boolean,
  error?: string,
  required?: boolean,
  maxLength?: number,
}

export default function TextField({
    label,
    placeholder,
    onChangeText,
    value,
    isPassword = false,
    disabled = false,
    error,
    required = false,
    maxLength
  }: TextFieldProps) {

  const [isFocused, setIsFocused] = useState<boolean>(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState<boolean>(false);
  const [isPasswordToggleVisible, setIsPasswordToggleVisible] = useState<boolean>(false);

  return (
    <View className='w-full flex-col gap-2'>
      {/* Label Text */}
      {
        label &&
        <Text className='text-base text-text font-interMedium'>
          {label} {required && <Text className='text-redHead-200'>*</Text>}
        </Text>
      }

      {/* Text Input Area */}
      <View className={`bg-white border-2 rounded-2xl pl-2 pr-4 h-16 flex-row items-center
        ${error ? 'border-redHead-200' : isFocused ? 'border-primary' : 'border-grey-200'}`
      }>
        <TextInput
          value={value}
          numberOfLines={1}
          secureTextEntry={isPassword && !isPasswordVisible}
          editable={!disabled}
          maxLength={maxLength}

          onChangeText={onChangeText}

          style={{
            flex: 1,
            height: '100%',
            paddingVertical: 0,
            color: disabled ? COLORS.mediumGrey : COLORS.text,

            fontFamily: 'Inter_24pt-Regular',
            fontSize: 16,
            lineHeight: 20,
          }}
          placeholder={placeholder}
          placeholderTextColor={COLORS.mediumGrey}

          onFocus={() => {
            setIsFocused(true);
            setIsPasswordToggleVisible(true);
          }}
          // When the user taps out of the input field
          onBlur={() => {
            setIsFocused(false);
            setIsPasswordToggleVisible(false);
          }}
        />

        {/* Password toggle button */}
        {isPassword && isPasswordToggleVisible && (
          <TouchableOpacity
            onPress={() => setIsPasswordVisible(!isPasswordVisible)}
            className='ml-2'
          >
            <Ionicons
              name={isPasswordVisible ? 'eye-off-outline' : 'eye-outline'}
              size={24}
              color={COLORS.mediumGrey}
            />
          </TouchableOpacity>
        )}

      </View>

      {/* Error Message */}
      {error && (
        <Text className='text-redHead-200 text-base font-inter mt-[1px]'>
          {error}
        </Text>
      )}
    </View>
  )
}