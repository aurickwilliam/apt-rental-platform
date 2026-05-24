import { View, Text } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';

import { COLORS , PROVINCES , GENDERS } from '@repo/constants';

import ScreenWrapper from 'components/layout/ScreenWrapper';
import DateTimeField from 'components/inputs/DateTimeField';
import DropdownField from 'components/inputs/DropdownField';

import { usePasswordValidation, usePHPostalCode } from '@repo/hooks';

import { useRegistrationStore } from '@/store/useRegistrationStore';

import { 
  CloseButton,
  TextField,
  Label,
  Input,
  FieldError,
  Button
} from 'heroui-native';

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

  const { setData, reset } = useRegistrationStore();

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

    if (!isPasswordValid || emptyFields.length > 0 || !isPostalCodeValidOnSubmit) return;

    const { confirmPassword, ...rest } = profileForm; // exclude confirmPassword

    setData({
      ...rest,
      postalCode,
      password,
      userSide: userSide as 'tenant' | 'landlord',
    });

    router.push('/(auth)/verify-mobile');
  }

  const handleBackToSignUp = () => {
    reset();
    router.replace('/sign-up');
  }

  return (
    <ScreenWrapper
      scrollable
      className='p-5'
    >

      {/* Back button */}
      <CloseButton 
        onPress={handleBackToSignUp} 
        iconProps={{ size: 20, color: COLORS.text }}
      />

      {/* Title */}
      <Text className="text-2xl text-text font-interSemiBold my-5">
        Complete Your {userSide === 'landlord' ? "Landlord " : "Tenant"} Profile
      </Text>

      {/* Form Inputs */}

      <View className="flex gap-4">
        {/* Email Address Field */}
        <TextField isDisabled>
          <Label>Email Address:</Label>
          <Input value={emailValue} />
        </TextField>

        {/* First Name Field */}
        <TextField isRequired isInvalid={!!getError('firstName')}>
          <Label>First Name:</Label>
          <Input
            placeholder="Enter your first name"
            onChangeText={(value) => updateField('firstName', value)}
          />
          {getError('firstName') && <FieldError>{getError('firstName')}</FieldError>}
        </TextField>

        {/* Last Name Field */}
        <TextField isRequired isInvalid={!!getError('lastName')}>
          <Label>Last Name:</Label>
          <Input
            placeholder="Enter your last name"
            onChangeText={(value) => updateField('lastName', value)}
          />
          {getError('lastName') && <FieldError>{getError('lastName')}</FieldError>}
        </TextField>

        {/* Middle Name Field */}
        <TextField>
          <Label>Middle Name:</Label>
          <Input
            placeholder="Enter your middle name"
            onChangeText={(value) => updateField('middleName', value)}
          />
        </TextField>

        {/* Gender Field */}
        <DropdownField
          label="Gender:"
          bottomSheetLabel="Select your gender"
          placeholder="Select your gender"
          options={GENDERS}
          value={profileForm.gender}
          onSelect={(value) => updateField('gender', value)}
          required
          error={getError('gender')}
        />

        {/* Current Address Field */}
        <TextField isRequired isInvalid={!!getError('currentAddress')}>
          <Label>Current Address:</Label>
          <Input
            placeholder="Enter your current address"
            onChangeText={(value) => updateField('currentAddress', value)}
          />
          {getError('currentAddress') && <FieldError>{getError('currentAddress')}</FieldError>}
        </TextField>

        {/* Barangay Field */}
        <TextField isRequired isInvalid={!!getError('barangay')}>
          <Label>Barangay:</Label>
          <Input
            placeholder="Enter your barangay"
            onChangeText={(value) => updateField('barangay', value)}
          />
          {getError('barangay') && <FieldError>{getError('barangay')}</FieldError>}
        </TextField>

        {/* City Field */}
        <TextField isRequired isInvalid={!!getError('city')}>
          <Label>City:</Label>
          <Input
            placeholder="Enter your city"
            onChangeText={(value) => updateField('city', value)}
          />
          {getError('city') && <FieldError>{getError('city')}</FieldError>}
        </TextField>

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
        <TextField isRequired isInvalid={!!getError('postalCode')}>
          <Label>Postal Code</Label>
          <Input
            placeholder="Enter your postal code"
            keyboardType="numeric"
            maxLength={4}
            value={postalCode}
            onChangeText={(value) => {
              handlePostalCodeChange(value);
              updateField('postalCode', value);
            }}
            onBlur={handlePostalCodeBlur}
          />
          {getError('postalCode') && (
            <FieldError>{getError('postalCode')}</FieldError>
          )}
        </TextField>

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
        <TextField isRequired isInvalid={!!getError('password')}>
          <Label>Password:</Label>
          <Input
            placeholder="Create a password"
            secureTextEntry
            value={password}
            onChangeText={(value) => {
              setPassword(value);
              updateField('password', value);
            }}
          />
          {getError('password') && <FieldError>{getError('password')}</FieldError>}
        </TextField>

        {/* Confirm Password Field */}
        <TextField isRequired isInvalid={!!getError('confirmPassword')}>
          <Label>Confirm Password:</Label>
          <Input
            placeholder="Confirm your password"
            secureTextEntry
            value={confirmPassword}
            onChangeText={(value) => {
              setConfirmPassword(value);
              updateField('confirmPassword', value);
            }}
          />
          {getError('confirmPassword') && <FieldError>{getError('confirmPassword')}</FieldError>}
        </TextField>

        {/* Password Checker */}
        <View className="flex-col gap-1">
          <Text className='text-text font-interMedium mb-2'>
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
        <Button onPress={handleSubmit}>
          <Button.Label>
            Submit
          </Button.Label>
        </Button>
      </View>

    </ScreenWrapper>
  )
}
