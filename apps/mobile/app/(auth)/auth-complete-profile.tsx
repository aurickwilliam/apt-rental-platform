import { View, Text } from 'react-native'
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
  usePHMobileValidation, 
  usePHPostalCode 
} from '@repo/hooks';

import { supabase } from "@repo/supabase";
import { useRegistrationStore } from '@/store/useRegistrationStore';

import { getProfileSubmitError } from '@repo/utils';

import { 
  CloseButton,
  TextField,
  Label,
  Input,
  FieldError,
  Button,
  Separator,
  Spinner,
} from 'heroui-native';

type ProfileForm = {
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
]

export default function AuthCompleteProfile() {
  const router = useRouter();

  const { email, userSide } = useLocalSearchParams();
  const { setData, reset, data } = useRegistrationStore();

  const emailValue = Array.isArray(email) ? email[0] : email;

  const [submitted, setSubmitted] = useState<boolean>(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorDialogOpen, setErrorDialogOpen] = useState(false);

  const [profileForm, setProfileForm] = useState<ProfileForm>({
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
  });

  // Postal code hook
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

  const updateField = (key: keyof ProfileForm, value: string | Date | null) => {
    setProfileForm(prev => ({ ...prev, [key]: value }));
  };

  const getError = (field: keyof ProfileForm) => {
    if (submitted && requiredFields.includes(field) && !profileForm[field]?.trim()) {
      return 'This field is required';
    }

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

  const handleSubmit = async () => {
    setSubmitted(true);

    const isPostalCodeValidOnSubmit = validatePostalCode();
    const isMobileValidOnSubmit = validateMobileNumber();
    const emptyFields = requiredFields.filter(field => !profileForm[field]?.trim());

    if (
      emptyFields.length > 0 || 
      !isPostalCodeValidOnSubmit || 
      !isMobileValidOnSubmit.isValid
    ) return;

    setLoading(true);

    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!user) throw new Error('No authenticated user found.');

      const { error: updateError } = await supabase.auth.updateUser({
        data: {
          full_name: `${profileForm.firstName} ${profileForm.lastName}${profileForm.suffixName ? ` ${profileForm.suffixName}` : ''}`,
        }
      });
      if (updateError) throw updateError;

      // Write profile data to users table
      const { error: profileUpdateError } = await supabase
        .from('users')
        .update({
          first_name: profileForm.firstName,
          last_name: profileForm.lastName,
          middle_name: profileForm.middleName || null,
          suffix: profileForm.suffixName || null,
          gender: profileForm.gender,
          birth_date: profileForm.birthDate,
          mobile_number: mobileValidation.formattedNumber ?? mobileNumber,
          province: profileForm.province,
          city: profileForm.city,
          barangay: profileForm.barangay,
          postal_code: postalCode ? parseInt(postalCode, 10) : null,
          street_address: profileForm.streetAddress,
          role: Array.isArray(userSide) ? userSide[0] : userSide,
        })
        .eq('user_id', user.id);

      if (profileUpdateError) throw profileUpdateError;

      setData({
        ...profileForm,
        postalCode,
        mobileNumber: mobileValidation.formattedNumber ?? mobileNumber,
        userSide: userSide as 'tenant' | 'landlord',
      });

      router.replace(
        userSide === "landlord"
          ? "../(tabs)/(landlord)/dashboard"
          : "../(tabs)/(tenant)/rentals",
      );
    } catch (err: any) {
      setError(getProfileSubmitError(err));
      setErrorDialogOpen(true);
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    reset();
    router.back();
  };

  const handleCityChange = (city: string | null) => {
    if (!city) return;
    updateField('city', city);
    updateField('barangay', '');
    const code = getPostalCode(city);
    if (code) setPostalCode(code);
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
  const barangaysForSelectedCity = profileForm.city
    ? getBarangaysByCity(profileForm.city)
    : [];

  return (
    <ScreenWrapper scrollable className="p-5">
      {/* Back button */}
      <CloseButton
        onPress={handleBack}
        iconProps={{ size: 20, color: COLORS.text }}
      />

      {/* Title */}
      <Text className="text-2xl text-text font-interSemiBold my-5">
        Complete Your {userSide === "landlord" ? "Landlord " : "Tenant"} Profile
      </Text>

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