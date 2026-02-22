import { View, Text, Pressable } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';

import { COLORS , PROVINCES , GENDER } from '@repo/constants';

import ScreenWrapper from 'components/layout/ScreenWrapper';
import TextField from 'components/inputs/TextField';
import PillButton from 'components/buttons/PillButton';
import NumberField from 'components/inputs/NumberField';
import DateTimeField from 'components/inputs/DateTimeField';
import DropdownField from 'components/inputs/DropdownField';

import { usePasswordValidation, usePHPostalCode } from '@repo/hooks';

type ProfileForm = {
  email: string;
  firstName: string;
  lastName: string;
  middleName: string;
  gender: string;
  currentAddress: string;
  barangay: string;
  city: string;
  province: string;
  postalCode: string;
  birthDate: string;
  password: string;
  confirmPassword: string;
}

const requiredFields: (keyof ProfileForm)[] = [
  'firstName',
  'lastName',
  'gender',
  'currentAddress',
  'barangay',
  'city',
  'province',
  'postalCode',
  'birthDate',
  'password',
  'confirmPassword',
]

export default function CompleteProfile() {
  const router = useRouter();
  const { email, userSide } = useLocalSearchParams();

  // Handle case where email might be an array
  const emailValue = Array.isArray(email) ? email[0] : email;

  const [submitted, setSubmitted] = useState<boolean>(false);

  const [profileForm, setProfileForm] = useState<ProfileForm>({
    email: emailValue || "",
    firstName: "",
    lastName: "",
    middleName: "",
    gender: "",
    currentAddress: "",
    barangay: "",
    city: "",
    province: "",
    postalCode: "",
    birthDate: "",
    password: "",
    confirmPassword: ""
  });

  // Password validation hook
  const {
    password,
    setPassword,
    confirmPassword,
    setConfirmPassword,
    passwordRequirements,
    isPasswordValid,
  } = usePasswordValidation();

  // Postal code hook
  const { 
    value: postalCode,
    error: postalCodeError,
    handleChange: handlePostalCodeChange,
    handleBlur: handlePostalCodeBlur,
    validate: validatePostalCode,
  } = usePHPostalCode();

  // Update individual field in profile form
  const updateField = (key: keyof ProfileForm, value: string | Date | null) => {
    setProfileForm(prev => ({ ...prev, [key]: value }));
  };

  // Return error message if field is required and not filled out after form submission
  const getError = (field: keyof ProfileForm) => {
    if (submitted && requiredFields.includes(field) && !profileForm[field]?.trim()) {
      return 'This field is required';
    }

    if (submitted && field === 'password' && profileForm.password && !isPasswordValid) {
      return 'Password does not meet the requirements or password does not match';
    }

    if (submitted && field === 'confirmPassword' && profileForm.confirmPassword && password !== confirmPassword) {
      return 'Passwords do not match';
    }

    if (field === 'postalCode' && postalCode && postalCodeError) {
      return postalCodeError;
    }

    return undefined;
  };

  const handleSubmit = () => {
    setSubmitted(true);
    const isPostalCodeValidOnSubmit = validatePostalCode();

    const emptyFields = requiredFields.filter(field => !profileForm[field]?.trim());

    if (!isPasswordValid || emptyFields.length > 0 || !isPostalCodeValidOnSubmit) {
      return;
    }
    
    const formData = {
      ...profileForm,
      postalCode, 
      password, 
      confirmPassword,
    }
    
    // Print form data to console (for testing purposes)
    Object.entries(formData).forEach(([key, value]) => {
      console.log(`${key}: ${value}`);
    });

    router.push('/(auth)/verify-mobile');
  }

  return (
    <ScreenWrapper
      scrollable
      className='p-5'
    >

      {/* Back button */}
      <Pressable className="mb-3" onPress={router.back}>
        <Ionicons name="close" size={30} color={COLORS.text} />
      </Pressable>

      {/* Title */}
      <Text className="text-2xl text-text font-poppinsSemiBold my-5">
        Complete Your {userSide === 'landlord' ? "Landlord " : "Tenant"} Profile
      </Text>

      {/* Form Inputs */}

      <View className="flex gap-4">
        {/* Email Address Field */}
        <TextField
          label="Email Address:"
          value={emailValue}
          disabled
        />

        {/* First Name Field */}
        <TextField
          label="First Name:"
          placeholder="Enter your first name"
          required
          onChangeText={(value) => updateField('firstName', value)}
          error={getError('firstName')}
        />

        {/* Last Name Field */}
        <TextField
          label="Last Name:"
          placeholder="Enter your last name"
          required
          onChangeText={(value) => updateField('lastName', value)}
          error={getError('lastName')}
        />

        {/* Middle Name Field */}
        <TextField
          label="Middle Name:"
          placeholder="Enter your middle name"
          onChangeText={(value) => updateField('middleName', value)}
        />

        {/* Gender Field */}
        <DropdownField
          label="Gender:"
          bottomSheetLabel="Select your gender"
          placeholder="Select your gender"
          options={GENDER}
          value={profileForm.gender}
          onSelect={(value) => updateField('gender', value)}
          required
          error={getError('gender')}
        />

        {/* Current Address Field */}
        <TextField
          label="Current Address:"
          placeholder="Enter your current address"
          required
          onChangeText={(value) => updateField('currentAddress', value)}
          error={getError('currentAddress')}
        />

        {/* Barangay Field */}
        <TextField
          label="Barangay:"
          placeholder="Enter your barangay"
          required
          onChangeText={(value) => updateField('barangay', value)}
          error={getError('barangay')}
        />

        {/* City Field  */}
        <TextField
          label="City:"
          placeholder="Enter your city"
          required
          onChangeText={(value) => updateField('city', value)}
          error={getError('city')}
        />

        {/* Province Field */}
        <DropdownField
          label="Province:"
          bottomSheetLabel="Select your province"
          placeholder="Select your province"
          options={PROVINCES}
          value={profileForm.province}
          onSelect={(value) => updateField('province', value)}
          enableSearch
          searchPlaceholder="Search provinces..."
          required
          error={getError('province')}
        />

        {/* Postal Code Field */}
        <NumberField
          label="Postal Code:"
          placeholder="Enter your postal code"
          maxLength={4}
          value={postalCode}
          onChange={(value) => {
            handlePostalCodeChange(value);
            updateField('postalCode', value);
          }}
          onBlur={handlePostalCodeBlur}
          required
          error={getError('postalCode')} 
        />

        {/* Date of Birth Field */}
        <DateTimeField
          label='Date of Birth:'
          placeholder='Select your date of birth'
          required
          value={profileForm.birthDate ? new Date(profileForm.birthDate) : null}
          onChange={(date) => {
            const formattedDate = date.toISOString().split("T")[0];
            updateField('birthDate', formattedDate);
          }}
          error={getError('birthDate')}
        />

        {/* Password Field */}
        <TextField
          label="Password:"
          placeholder="Create a password"
          isPassword
          required
          value={password}
          onChangeText={(value) => {
            setPassword(value); 
            updateField('password', value);
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
            updateField('confirmPassword', value);
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

      {/* Submit Button */}
      <View className="mt-16 mb-0">
        <PillButton
          label="Submit"
          isFullWidth
          onPress={handleSubmit}
        />
      </View>

    </ScreenWrapper>
  )
}
