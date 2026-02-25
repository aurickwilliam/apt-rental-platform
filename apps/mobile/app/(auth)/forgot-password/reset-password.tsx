import { View, Text } from 'react-native'
import Ionicons from '@expo/vector-icons/build/Ionicons';
import { useState } from 'react';
import { useRouter } from 'expo-router';

import ScreenWrapper from '@/components/layout/ScreenWrapper'
import TextField from '@/components/inputs/TextField';
import PillButton from '@/components/buttons/PillButton';

import { COLORS } from '@repo/constants';

import { usePasswordValidation } from '@repo/hooks';

export default function ResetPassword() {
  const router = useRouter();

  const [submitted, setSubmitted] = useState<boolean>(false);

  const requiredFields = [
    'password',
    'confirmPassword',
  ]

  // Password validation hook
  const {
    password,
    setPassword,
    confirmPassword,
    setConfirmPassword,
    passwordRequirements,
    isPasswordValid,
  } = usePasswordValidation();
  
  // Return error message if field is required and not filled out after form submission
  const getError = (field: string) => {
    if (submitted && requiredFields.includes(field) && (!password?.trim() || !confirmPassword?.trim())) {
      return 'This field is required';
    }

    if (submitted && field === 'password' && !isPasswordValid) {
      return 'Password does not meet the requirements or password does not match';
    }

    if (submitted && field === 'confirmPassword' && password !== confirmPassword) {
      return 'Passwords do not match';
    }

    return undefined;
  };

  // Handle form submission
  const handleSubmit = () => {
    setSubmitted(true);

    if (!isPasswordValid) {
      return;
    }

    router.push('/(auth)/forgot-password/updated');
  }
  return (
    <ScreenWrapper
      className='p-5'
    >
      <View className='flex gap-3'>
        <Text className='text-4xl text-text font-poppinsSemiBold'>
          Reset Password
        </Text>

        <Text className='text-lg text-text font-inter'>
          Almost done! Let’s set a fresh new password.
        </Text>
      </View>

      <View className='flex gap-3 mt-5'>

        {/* Password Field */}
        <TextField
          label="Password:"
          placeholder="Create a password"
          isPassword
          required
          value={password}
          onChangeText={(value) => {
            setPassword(value); 
          }}
          error={getError('password')}
        />

        {/* Confirm Password Field */}
        <TextField
          label="Confirm Password:"
          placeholder="Confirm your password"
          isPassword
          required
          value={confirmPassword}
          onChangeText={(value) => {
            setConfirmPassword(value);
          }}
          error={getError('confirmPassword')}
        />

        {/* Password Checker */}
        <View className="flex-col gap-1">
          <Text className='text-base text-text font-interMedium mb-2'>
            Your password must contain:
          </Text>

          {/* Minimum Length of 8 Char */}
          <View className="flex-row items-center gap-2">
            <Ionicons
              name={passwordRequirements.minLength ? "checkmark-circle" : "remove"}
              size={24}
              color={passwordRequirements.minLength ? COLORS.greenHulk : COLORS.lightGrey}
            />
            <Text className='text-text font-inter'>At least 8 characters</Text>
          </View>

          {/* At least one lowercase letter (a–z) */}
          <View className="flex-row items-center gap-2">
            <Ionicons
              name={passwordRequirements.hasLowercase ? "checkmark-circle" : "remove"}
              size={24}
              color={passwordRequirements.hasLowercase ? COLORS.greenHulk : COLORS.lightGrey}
            />
            <Text className='text-text font-inter'>
              At least one lowercase letter (a–z)
            </Text>
          </View>

          {/* At least one uppercase letter (A–Z) */}
          <View className="flex-row items-center gap-2">
            <Ionicons
              name={passwordRequirements.hasUppercase ? "checkmark-circle" : "remove"}
              size={24}
              color={passwordRequirements.hasUppercase ? COLORS.greenHulk : COLORS.lightGrey}
            />
            <Text className='text-text font-inter'>
              At least one uppercase letter (A–Z)
            </Text>
          </View>

          {/* At least one number (0–9) */}
          <View className="flex-row items-center gap-2">
            <Ionicons
              name={passwordRequirements.hasNumber ? "checkmark-circle" : "remove"}
              size={24}
              color={passwordRequirements.hasNumber ? COLORS.greenHulk : COLORS.lightGrey}
            />
            <Text className='text-text font-inter'>
              At least one number (0–9)
            </Text>
          </View>

          {/* At least one special character (e.g. ! @ # $ % ^ & *) */}
          <View className="flex-row items-center gap-2">
            <Ionicons
              name={passwordRequirements.hasSpecialChar ? "checkmark-circle" : "remove"}
              size={24}
              color={passwordRequirements.hasSpecialChar ? COLORS.greenHulk : COLORS.lightGrey}
            />
            <Text className='text-text font-inter'>
              at least one special character (e.g. ! @ # $ % ^ & *)
            </Text>
          </View>
        </View>
      </View>

      <View className='flex-1' />

      <PillButton
        label="Submit"
        isFullWidth
        onPress={handleSubmit}
      />
    </ScreenWrapper>
  )
}