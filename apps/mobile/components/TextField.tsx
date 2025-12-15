import { View, Text, TextInput, TouchableOpacity } from 'react-native'
import { useState } from 'react'
import { FontAwesome6 } from '@expo/vector-icons'

import { COLORS } from '@/constants/colors'

interface TextFieldProps {
  label?: string,
  placeholder?: string,
  onChangeText?: (text: string) => void,
  value?: string,
  isPassword?: boolean,
  disabled?: boolean,
  error?: string,
  required?: boolean,
}

export default function TextField({
    label, 
    placeholder, 
    onChangeText, 
    value, 
    isPassword = false,
    disabled = false,
    error,
    required = false
  }: TextFieldProps) {

  const [isFocused, setIsFocused] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isPasswordToggleVisible, setIsPasswordToggleVisible] = useState(false);

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
        <View className={`bg-white border-2 rounded-2xl pl-2 pr-4 h-16 flex-row items-center
          ${error ? 'border-redHead-200' : isFocused ? 'border-primary' : 'border-grey-200'}`
        }>
          <TextInput 
            value={value}
            numberOfLines={1}
            secureTextEntry={isPassword && !isPasswordVisible}
            editable={!disabled}

            onChangeText={onChangeText}

            className='flex-1 text-text font-inter text-lg'
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
              <FontAwesome6 
                name={isPasswordVisible ? 'eye-slash' : 'eye'} 
                size={24} 
                color={COLORS.mediumGrey}
              />
            </TouchableOpacity>
          )}

        </View>

        {/* Error Message */}
        {error && (
          <Text className='text-redHead-200 text-md font-inter -mt-1'>
            {error}
          </Text>
        )}
    </View>
  )
}