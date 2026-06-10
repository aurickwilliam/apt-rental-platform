import { View, Text, Pressable } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useState } from 'react';

import {
  COLORS,
  PROVINCES,
  GENDERS,
  SUFFIXES,
  getCitiesByProvince,
  getBarangaysByCity,
  getPostalCode
} from "@repo/constants";

import ScreenWrapper from 'components/layout/ScreenWrapper';
import DateField from '@/components/inputs/DateField';
import DropdownField from 'components/inputs/DropdownField';
import ErrorDialog from '@/components/display/ErrorDialog';

import { 
  usePasswordValidation, 
  usePHMobileValidation, 
  usePHPostalCode 
} from '@repo/hooks';

import { supabase } from "@repo/supabase";
import { useRegistrationStore } from '@/store/useRegistrationStore';

import { 
  CloseButton,
  TextField,
  Label,
  Input,
  FieldError,
  Button,
  Separator,
  Spinner,
  InputGroup,
} from 'heroui-native';

import { 
  Eye, 
  EyeOff,
  CircleCheck,
  Minus,
} from "lucide-react-native";

type ProfileForm = {
  email: string;
  firstName: string;
  lastName: string;
  middleName: string;
  suffixName: string;
  gender: string;
  birthDate: string;

  province: string;
  city: string;
  barangay: string;
  streetAddress: string;

  password: string;
  confirmPassword: string;
}

const requiredFields: (keyof ProfileForm)[] = [
  'firstName',
  'lastName',
  'gender',
  'birthDate',

  'province',
  'city',
  'barangay',
  'streetAddress',

  'password',
  'confirmPassword',
]

export default function CompleteProfile() {
  const router = useRouter();

  const { email, userSide } = useLocalSearchParams();
  const { setData, reset, data } = useRegistrationStore();

  // Handle case where email might be an array
  const emailValue = Array.isArray(email) ? email[0] : email;

  const [submitted, setSubmitted] = useState<boolean>(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorDialogOpen, setErrorDialogOpen] = useState(false);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [profileForm, setProfileForm] = useState<ProfileForm>({
    email: emailValue || "",
    firstName: "",
    lastName: "",
    middleName: "",
    suffixName: "",
    gender: "",
    birthDate: "",

    province: "",
    city: "",
    barangay: "",
    streetAddress: "",

    password: "",
    confirmPassword: ""
  });

  // Password validation hook
  // Tracks password strength requirements separately from the form state
  const {
    password,
    setPassword,
    confirmPassword,
    setConfirmPassword,
    passwordRequirements,
    isPasswordValid,
  } = usePasswordValidation();

  // Postal code hook
  // Validates that a PH postal code is exactly 4 digits with proper blur/change handling
  const {
    value: postalCode,
    setValue: setPostalCode,
    error: postalCodeError,
    handleChange: handlePostalCodeChange,
    handleBlur: handlePostalCodeBlur,
    validate: validatePostalCode,
  } = usePHPostalCode();

  // Mobile Number validation hook
  const {
    value: mobileNumber,
    validation: mobileValidation,
    onChange: onMobileChange,
    validate: validateMobileNumber,
  } = usePHMobileValidation(data.mobileNumber ?? "");

  // Update individual field in profile form
  const updateField = (key: keyof ProfileForm, value: string | Date | null) => {
    setProfileForm(prev => ({ ...prev, [key]: value }));
  };

  // Return error message if field is required and not filled out after form submission
  const getError = (field: keyof ProfileForm) => {
    // Required field check
    if (submitted && requiredFields.includes(field) && !profileForm[field]?.trim()) {
      return 'This field is required';
    }

    // Password validation errors
    if (submitted && field === 'password' && profileForm.password && !isPasswordValid) {
      return 'Password does not meet the requirements or password does not match';
    }

    // Confirm password match check
    if (submitted && field === 'confirmPassword' && profileForm.confirmPassword && password !== confirmPassword) {
      return 'Passwords do not match';
    }
    
    // Birth Date Validation
    if (field === 'birthDate' && profileForm.birthDate) {
      const birth = new Date(profileForm.birthDate);
      const today = new Date();

      const age = today.getFullYear() - birth.getFullYear();
      const hasBirthdayPassed =
        today.getMonth() > birth.getMonth() ||
        (today.getMonth() === birth.getMonth() && today.getDate() >= birth.getDate());
      const actualAge = hasBirthdayPassed ? age : age - 1;

      if (birth > today) return 'Date of birth cannot be in the future';
      if (actualAge < 18) return 'You must be at least 18 years old';
      if (actualAge > 120) return 'Please enter a valid date of birth';
    }

    return undefined;
  };


  // Handle Form Submission and Sign Up with Supabase
  const handleSubmit = async () => {
    setSubmitted(true);

    // set up validation checks for all fields on submit
    const isPostalCodeValidOnSubmit = validatePostalCode();
    const isMobileValidOnSubmit = validateMobileNumber();
    const emptyFields = requiredFields.filter(field => !profileForm[field]?.trim());

    // if any validation fails, return early and show errors
    if (
      !isPasswordValid || 
      emptyFields.length > 0 || 
      !isPostalCodeValidOnSubmit || 
      !isMobileValidOnSubmit.isValid
    ) return;

    // exclude confirmPassword
    const { confirmPassword, ...rest } = profileForm; 

    setLoading(true);

    try {
      // Sign up the user with Supabase Auth using email and password
      const { error } = await supabase.auth.signUp({
        email: emailValue!,
        password,
        options: { data: { full_name: `${profileForm.firstName} ${profileForm.lastName} ${profileForm.suffixName}` } }
      });
      if (error) throw error;

      // Set the data to the registration store for the OTP verification step
      setData({
        ...rest,
        postalCode,
        password,
        mobileNumber: mobileValidation.formattedNumber ?? mobileNumber,
        userSide: userSide as 'tenant' | 'landlord',
      });

      // Navigate to OTP verification screen with email as param
      router.push({ pathname: '/(auth)/otp-verification', params: { email: emailValue } });
    } catch (err: any) {
      setError(err.message);
      setErrorDialogOpen(true);
    } finally {
      setLoading(false);
    }
  }

  const handleBackToSignUp = () => {
    reset();
    router.back();
  }

  const handleCityChange = (city: string | null) => {
    if (!city) return;

    updateField('city', city);
    updateField('barangay', '');

    const code = getPostalCode(city);
    if (code) {
      setPostalCode(code);
    }
  };

  const handleProvinceChange = (province: string | null) => {
    if (!province) return;
    updateField('province', province);
    updateField('city', '');
    updateField('barangay', '');
    setPostalCode('');
  };

  const citiesForSelectedProvince = profileForm.province
    ? getCitiesByProvince(profileForm.province as Parameters<typeof getCitiesByProvince>[0])
    : [];
  const barangaysForSelectedCity = profileForm.city ? getBarangaysByCity(profileForm.city) : [];

  return (
    <ScreenWrapper scrollable className="p-5">
      {/* Back button */}
      <CloseButton
        onPress={handleBackToSignUp}
        iconProps={{ size: 20, color: COLORS.text }}
      />

      {/* Title */}
      <Text className="text-2xl text-text font-interSemiBold my-5">
        Complete Your {userSide === "landlord" ? "Landlord " : "Tenant"} Profile
      </Text>

      {/* Form Inputs */}

      <View className="flex gap-4">
        {/* Email Address Field */}
        <TextField isDisabled>
          <Label>Email Address:</Label>
          <Input value={emailValue} />
        </TextField>

        <Separator />

        {/* 
          ===== Personal Information Section =====
        */}
        <Text className="text-xl font-interMedium mt-3">
          Personal Information
        </Text>

        {/* First Name Field */}
        <TextField isRequired isInvalid={!!getError("firstName")}>
          <Label>First Name:</Label>
          <Input
            placeholder="Enter your first name"
            onChangeText={(value) => updateField("firstName", value)}
          />
          {getError("firstName") && (
            <FieldError>{getError("firstName")}</FieldError>
          )}
        </TextField>

        {/* Last Name Field */}
        <TextField isRequired isInvalid={!!getError("lastName")}>
          <Label>Last Name:</Label>
          <Input
            placeholder="Enter your last name"
            onChangeText={(value) => updateField("lastName", value)}
          />
          {getError("lastName") && (
            <FieldError>{getError("lastName")}</FieldError>
          )}
        </TextField>

        {/* Middle Name Field */}
        <TextField>
          <Label>Middle Name:</Label>
          <Input
            placeholder="Enter your middle name"
            onChangeText={(value) => updateField("middleName", value)}
          />
        </TextField>

        {/* Suffix Name Field */}
        <DropdownField
          label="Suffix Name:"
          bottomSheetLabel="Select your suffix name"
          placeholder="No suffix"
          options={SUFFIXES}
          value={profileForm.suffixName}
          onSelect={(value) => updateField("suffixName", value)}
        />

        {/* Gender Field */}
        <DropdownField
          label="Gender:"
          bottomSheetLabel="Select your gender"
          placeholder="Select your gender"
          options={GENDERS}
          value={profileForm.gender}
          onSelect={(value) => updateField("gender", value)}
          required
          error={getError("gender")}
        />

        {/* Date of Birth Field */}
        <DateField
          label="Date of Birth:"
          placeholder="Select your date of birth"
          required
          value={profileForm.birthDate ? new Date(profileForm.birthDate) : null}
          onChange={(date) => {
            const formattedDate = date.toISOString().split("T")[0];
            updateField("birthDate", formattedDate);
          }}
          error={getError("birthDate")}
        />

        {/* Mobile Number Field */}
        <TextField isRequired isInvalid={!!mobileValidation.errorMessage}>
          <Label>Mobile Number:</Label>
          <Input
            placeholder="Enter your mobile number"
            keyboardType="phone-pad"
            maxLength={13}
            value={mobileNumber}
            onChangeText={(value) => {
              onMobileChange(value);
            }}
          />
          {mobileValidation.errorMessage && (
            <FieldError>{mobileValidation.errorMessage}</FieldError>
          )}
        </TextField>

        <Separator />

        {/* 
          ===== Address Information Section =====
        */}
        <Text className="text-xl font-interMedium mt-3">
          Address Information
        </Text>

        {/* Province Field */}
        <DropdownField
          label="Province:"
          bottomSheetLabel="Select your province"
          placeholder="Select your province"
          options={PROVINCES}
          value={profileForm.province}
          onSelect={handleProvinceChange}
          enableSearch
          searchPlaceholder="Search provinces..."
          required
          error={getError("province")}
        />

        {/* City Field */}
        <DropdownField
          label="City:"
          bottomSheetLabel="Select your city"
          placeholder="Select your city"
          options={profileForm.province ? citiesForSelectedProvince : []}
          value={profileForm.city}
          onSelect={handleCityChange}
          required
          error={getError("city")}
          enableSearch
          searchPlaceholder="Search cities..."
          disabled={!profileForm.province}
        />

        {/* Barangay Field */}
        <DropdownField
          label="Barangay:"
          bottomSheetLabel="Select your barangay"
          placeholder="Select your barangay"
          options={profileForm.city ? barangaysForSelectedCity : []}
          value={profileForm.barangay}
          onSelect={(value) => updateField("barangay", value)}
          required
          error={getError("barangay")}
          enableSearch
          searchPlaceholder="Search barangays..."
          disabled={!profileForm.city}
        />

        {/* Postal Code Field */}
        <TextField isRequired isInvalid={!!postalCodeError}>
          <Label>Postal Code:</Label>
          <Input
            placeholder="Enter your postal code"
            keyboardType="numeric"
            maxLength={4}
            value={postalCode}
            onChangeText={(value) => {
              handlePostalCodeChange(value);
            }}
            onBlur={handlePostalCodeBlur}
          />
          {postalCodeError && (
            <FieldError>{postalCodeError}</FieldError>
          )}
        </TextField>

        {/* Street Address Field */}
        <TextField isRequired isInvalid={!!getError("streetAddress")}>
          <Label>Street Address:</Label>
          <Input
            className="shadow-none"
            placeholder="Enter your street address"
            onChangeText={(value) => updateField("streetAddress", value)}
          />
          {getError("streetAddress") && (
            <FieldError>{getError("streetAddress")}</FieldError>
          )}
        </TextField>

        <Separator />

        {/* 
          ===== Account Security Section =====
        */}
        <Text className="text-xl font-interMedium mt-3">Account Security</Text>

        {/* Password Field */}
        <TextField isRequired isInvalid={!!getError("password")}>
          <Label>Password:</Label>
          <InputGroup>
            <InputGroup.Input
              placeholder="Create a password"
              secureTextEntry={!showPassword}
              value={password}
              onChangeText={(value) => {
                setPassword(value);
                updateField("password", value);
              }}
            />

            <InputGroup.Suffix>
              <Pressable
                onPress={() => setShowPassword(!showPassword)}
                hitSlop={20}
              >
                {showPassword ? (
                  <EyeOff size={20} color={COLORS.grey} />
                ) : (
                  <Eye size={20} color={COLORS.grey} />
                )}
              </Pressable>
            </InputGroup.Suffix>
          </InputGroup>
          {getError("password") && (
            <FieldError>{getError("password")}</FieldError>
          )}
        </TextField>

        {/* Confirm Password Field */}
        <TextField isRequired isInvalid={!!getError("confirmPassword")}>
          <Label>Confirm Password:</Label>
          <InputGroup>
            <InputGroup.Input
              placeholder="Confirm your password"
              secureTextEntry={!showConfirmPassword}
              value={confirmPassword}
              onChangeText={(value) => {
                setConfirmPassword(value);
                updateField("confirmPassword", value);
              }}
            />

            <InputGroup.Suffix>
              <Pressable
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                hitSlop={20}
              >
                {showConfirmPassword ? (
                  <EyeOff size={20} color={COLORS.grey} />
                ) : (
                  <Eye size={20} color={COLORS.grey} />
                )}
              </Pressable>
            </InputGroup.Suffix>
          </InputGroup>

          {getError("confirmPassword") && (
            <FieldError>{getError("confirmPassword")}</FieldError>
          )}
        </TextField>

        {/* Password Checker */}
        <View className="flex-col gap-1">
          <Text className="text-text font-interMedium mb-2">
            Your password must contain:
          </Text>

          {/* Minimum Length of 8 Char */}
          <View className="flex-row items-center gap-2">
            {passwordRequirements.minLength ? (
              <CircleCheck size={20} color={COLORS.greenHulk} />
            ) : (
              <Minus size={20} color={COLORS.lightGrey} />
            )}

            <Text className="text-text font-inter">At least 8 characters</Text>
          </View>

          {/* At least one lowercase letter (a–z) */}
          <View className="flex-row items-center gap-2">
            {passwordRequirements.hasLowercase ? (
              <CircleCheck size={20} color={COLORS.greenHulk} />
            ) : (
              <Minus size={20} color={COLORS.lightGrey} />
            )}

            <Text className="text-text font-inter">
              At least one lowercase letter (a–z)
            </Text>
          </View>

          {/* At least one uppercase letter (A–Z) */}
          <View className="flex-row items-center gap-2">
            {passwordRequirements.hasUppercase ? (
              <CircleCheck size={20} color={COLORS.greenHulk} />
            ) : (
              <Minus size={20} color={COLORS.lightGrey} />
            )}

            <Text className="text-text font-inter">
              At least one uppercase letter (A–Z)
            </Text>
          </View>

          {/* At least one number (0–9) */}
          <View className="flex-row items-center gap-2">
            {passwordRequirements.hasNumber ? (
              <CircleCheck size={20} color={COLORS.greenHulk} />
            ) : (
              <Minus size={20} color={COLORS.lightGrey} />
            )}

            <Text className="text-text font-inter">
              At least one number (0–9)
            </Text>
          </View>

          {/* At least one special character (e.g. ! @ # $ % ^ & *) */}
          <View className="flex-row items-center gap-2">
            {passwordRequirements.hasSpecialChar ? (
              <CircleCheck size={20} color={COLORS.greenHulk} />
            ) : (
              <Minus size={20} color={COLORS.lightGrey} />
            )}
            <Text className="text-text font-inter">
              at least one special character (e.g. ! @ # $ % ^ & *)
            </Text>
          </View>
        </View>
      </View>

      {/* Submit Button */}
      <View className="mt-16 mb-0">
        <Button onPress={handleSubmit} isDisabled={loading}>
          <Button.Label>{loading ? "Please wait..." : "Submit"}</Button.Label>
          {loading && (
            <Spinner size="sm" color={COLORS.white} className="ml-2" />
          )}
        </Button>
      </View>

      {/* Error Dialog */}
      <ErrorDialog 
        isOpen={errorDialogOpen}
        onClose={() => setErrorDialogOpen(false)}
        message={error}
      />
    </ScreenWrapper>
  );
}
