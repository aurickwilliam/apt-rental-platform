import { View, Text, Pressable } from 'react-native'
import Ionicons from '@expo/vector-icons/build/Ionicons';
import { useState } from 'react';
import { useRouter } from 'expo-router';

import ScreenWrapper from '@/components/layout/ScreenWrapper'
import AppInput from '@/components/inputs/AppInput';

import { Button, FieldError, Label, TextField } from 'heroui-native';

import { usePasswordValidation } from '@repo/hooks';
import { useColors } from '@/hooks/useTheme';

import { IconEye, IconEyeOff } from '@tabler/icons-react-native';

export default function ResetPassword() {
  const router = useRouter();
  const { colors } = useColors();

  const [submitted, setSubmitted] = useState<boolean>(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

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
    <ScreenWrapper className="p-5">
      <View className="flex gap-1">
        <Text className="text-3xl text-text font-nunitoSemiBold">
          Reset Password
        </Text>

        <Text className="text-base text-text font-inter">
          Almost done! Let’s set a fresh new password.
        </Text>
      </View>

      <View className="flex gap-3 mt-5">
        {/* Password Field */}
        <TextField isRequired isInvalid={!!getError("password")}>
          <Label>Password:</Label>
          <View className="w-full flex-row items-center">
            <AppInput
              placeholder="Create a password"
              secureTextEntry={!showPassword}
              className="flex-1 pr-10"
              value={password}
              onChangeText={(value) => {
                setPassword(value);
              }}
            />

            <Pressable
              onPress={() => setShowPassword(!showPassword)}
              className="absolute right-3"
            >
              {showPassword ? (
                <IconEyeOff size={18} color={colors.textSecondary} />
              ) : (
                <IconEye size={18} color={colors.textSecondary} />
              )}
            </Pressable>
          </View>

          {!!getError("password") && (
            <FieldError>{getError("password")}</FieldError>
          )}
        </TextField>

        {/* Confirm Password Field */}
        <TextField isRequired isInvalid={!!getError("confirmPassword")}>
          <Label>Confirm Password:</Label>
          <View className="w-full flex-row items-center">
            <AppInput
              placeholder="Confirm your password"
              secureTextEntry={!showConfirmPassword}
              className="flex-1 pr-10"
              value={confirmPassword}
              onChangeText={(value) => {
                setConfirmPassword(value);
              }}
            />

            <Pressable
              onPress={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3"
            >
              {showConfirmPassword ? (
                <IconEyeOff size={18} color={colors.textSecondary} />
              ) : (
                <IconEye size={18} color={colors.textSecondary} />
              )}
            </Pressable>
          </View>

          {!!getError("confirmPassword") && (
            <FieldError>{getError("confirmPassword")}</FieldError>
          )}
        </TextField>

        {/* Password Checker */}
        <View className="flex-col gap-1 mt-5">
          <Text className="text-foreground font-interMedium mb-2">
            Your password must contain:
          </Text>

          {/* Minimum Length of 8 Char */}
          <View className="flex-row items-center gap-2">
            <Ionicons
              name={
                passwordRequirements.minLength ? "checkmark-circle" : "remove"
              }
              size={24}
              color={
                passwordRequirements.minLength
                  ? colors.success
                  : colors.textSecondary
              }
            />
            <Text className="text-foreground font-inter">
              At least 8 characters
            </Text>
          </View>

          {/* At least one lowercase letter (a–z) */}
          <View className="flex-row items-center gap-2">
            <Ionicons
              name={
                passwordRequirements.hasLowercase
                  ? "checkmark-circle"
                  : "remove"
              }
              size={24}
              color={
                passwordRequirements.hasLowercase
                  ? colors.success
                  : colors.textSecondary
              }
            />
            <Text className="text-foreground font-inter">
              At least one lowercase letter (a–z)
            </Text>
          </View>

          {/* At least one uppercase letter (A–Z) */}
          <View className="flex-row items-center gap-2">
            <Ionicons
              name={
                passwordRequirements.hasUppercase
                  ? "checkmark-circle"
                  : "remove"
              }
              size={24}
              color={
                passwordRequirements.hasUppercase
                  ? colors.success
                  : colors.textSecondary
              }
            />
            <Text className="text-foreground font-inter">
              At least one uppercase letter (A–Z)
            </Text>
          </View>

          {/* At least one number (0–9) */}
          <View className="flex-row items-center gap-2">
            <Ionicons
              name={
                passwordRequirements.hasNumber ? "checkmark-circle" : "remove"
              }
              size={24}
              color={
                passwordRequirements.hasNumber
                  ? colors.success
                  : colors.textSecondary
              }
            />
            <Text className="text-foreground font-inter">
              At least one number (0–9)
            </Text>
          </View>

          {/* At least one special character (e.g. ! @ # $ % ^ & *) */}
          <View className="flex-row items-center gap-2">
            <Ionicons
              name={
                passwordRequirements.hasSpecialChar
                  ? "checkmark-circle"
                  : "remove"
              }
              size={24}
              color={
                passwordRequirements.hasSpecialChar
                  ? colors.success
                  : colors.textSecondary
              }
            />
            <Text className="text-foreground font-inter">
              at least one special character (e.g. ! @ # $ % ^ & *)
            </Text>
          </View>
        </View>
      </View>

      <View className="flex-1" />

      {/* Submit Button */}
      <Button
        onPress={handleSubmit}
        className="mt-5"
        isDisabled={!isPasswordValid}
      >
        <Button.Label>Submit</Button.Label>
      </Button>
    </ScreenWrapper>
  );
}