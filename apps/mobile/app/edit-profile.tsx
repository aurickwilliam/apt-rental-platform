import {
  View,
  Text,
  Image,
  ImageSourcePropType,
  ActivityIndicator,
} from "react-native";
import { useState, useEffect, useRef } from "react";
import type { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";

import ScreenWrapper from "components/layout/ScreenWrapper";
import StandardHeader from "components/layout/StandardHeader";
import DropdownField from "components/inputs/DropdownField";
import DateField from "@/components/inputs/DateField";
import ErrorDialog from "@/components/display/ErrorDialog";
import SuccessDialog from "@/components/display/SuccessDialog";

import {
  PROVINCES,
  GENDERS,
  getCitiesByProvince,
  getBarangaysByCity,
  getPostalCode,
  Province,
} from "@repo/constants";

import { IconCamera, IconUser, IconHome } from "@tabler/icons-react-native";

import { useColors } from "@/hooks/useTheme";
import { useProfile } from "@/hooks/auth";
import { usePHPostalCode } from "@repo/hooks";
import { useImageUpload } from "@/hooks/apartments";

import { supabase } from "@repo/supabase";

import {
  Button,
  TextField,
  Input,
  Separator,
  Label,
  FieldError,
  Spinner,
} from "heroui-native";

type EditProfileForm = {
  backgroundImageUri: ImageSourcePropType | null;
  profileImageUri: ImageSourcePropType | null;
  // read-only
  firstName: string;
  lastName: string;
  middleName: string;
  dateOfBirth: Date | null;
  // editable
  gender: string;
  streetAddress: string;
  barangay: string;
  city: string;
  province: string;
};

type FormErrors = {
  gender?: string;
  streetAddress?: string;
  province?: string;
  city?: string;
  barangay?: string;
  postalCode?: string;
};

const EMPTY_FORM: EditProfileForm = {
  backgroundImageUri: null,
  profileImageUri: null,
  firstName: "",
  lastName: "",
  middleName: "",
  dateOfBirth: null,
  gender: "",

  streetAddress: "",
  barangay: "",
  city: "",
  province: "",
};

export default function EditProfile() {
  const { colors } = useColors();
  const { profile, loading } = useProfile();

  const [form, setForm] = useState<EditProfileForm>(EMPTY_FORM);
  const [errors, setErrors] = useState<FormErrors>({});
  const [saving, setSaving] = useState(false);

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Scroll-to-error refs
  const scrollRef = useRef<KeyboardAwareScrollView>(null);
  const contentRef = useRef<View>(null);
  const fieldPositions = useRef<Partial<Record<keyof FormErrors, number>>>({});

  const registerFieldRef = (field: keyof FormErrors) => (node: View | null) => {
    if (!node || !contentRef.current) return;
    node.measureLayout(
      contentRef.current,
      (_x: number, y: number) => { fieldPositions.current[field] = y; },
      () => {},
    );
  };

  const {
    value: postalCode,
    handleChange: onPostalCodeChange,
    validate: validatePostalCode,
    setValue: setPostalCode,
  } = usePHPostalCode();

  const { pickAndUpload, uploading } = useImageUpload(
    profile?.user_id,
    (message) => setErrorMessage(message)
  );

  // Fetch and set the current profile data into the form when it loads
  useEffect(() => {
    if (!profile) return;

    setForm({
      profileImageUri: profile.avatar_url
        ? { uri: profile.avatar_url }
        : null,

      backgroundImageUri: profile.background_url
        ? { uri: profile.background_url }
        : null,

      firstName: profile.first_name ?? "",
      lastName: profile.last_name ?? "",
      middleName: profile.middle_name ?? "",
      dateOfBirth: profile.birth_date
        ? new Date(profile.birth_date)
        : null,
      gender: profile.gender ?? "",

      streetAddress: profile.street_address ?? "",
      barangay: profile.barangay ?? "",
      city: profile.city ?? "",
      province: profile.province ?? "",
    });

    // Postal Code
    setPostalCode(
      profile.postal_code != null ? String(profile.postal_code) : "",
    );
  }, [profile, setPostalCode]);

  const updateForm = (patch: Partial<EditProfileForm>) => {
    setForm((prev) => ({ ...prev, ...patch }));
    // Clear errors for touched fields immediately
    const keys = Object.keys(patch) as (keyof FormErrors)[];
    setErrors((prev) => {
      const next = { ...prev };
      keys.forEach((k) => delete next[k]);
      return next;
    });
  };

  const handleProvinceChange = (value: string | null) => {
    updateForm({
      province: value ?? "",
      city: "",
      barangay: "",
    });
    setPostalCode("");
  };

  const handleCityChange = (value: string | null) => {
    if (!value) {
      updateForm({ city: "", barangay: ""});
      setPostalCode("");
      return;
    }
    const code = getPostalCode(value);
    updateForm({
      city: value,
      barangay: "",
    });

    setPostalCode(code ? String(code) : "");
  };

  const handlePostalCodeChange = (text: string) => {
    onPostalCodeChange(text);
    setErrors(prev => ({ ...prev, postalCode: undefined }));
  };

  // Filter Options for City and Barangay dropdowns based on current selections
  const cities = form.province
    ? getCitiesByProvince(form.province as Province)
    : [];
  const barangays = form.city ? getBarangaysByCity(form.city) : [];

  // Validation logic for the form fields
  const validateForm = (): boolean => {
    const errs: FormErrors = {};

    if (!form.gender) errs.gender = "Gender is required.";

    if (!form.province) errs.province = "Province is required.";

    if (form.province && !form.city) errs.city = "City is required.";

    if (form.city && !form.barangay) errs.barangay = "Barangay is required.";

    if (!validatePostalCode())
      errs.postalCode = !postalCode
        ? "Postal code is required."
        : "Enter a valid 4-digit PH ZIP code (1000–9999).";

    if (!form.streetAddress.trim())
      errs.streetAddress = "Street address is required.";

    setErrors(errs);
    const isValid = Object.keys(errs).length === 0;

    if (!isValid) {
      const fieldOrder: (keyof FormErrors)[] = [
        'gender', 'province', 'city', 'barangay', 'postalCode', 'streetAddress',
      ];
      const firstError = fieldOrder.find((field) => errs[field]);
      const y = firstError ? fieldPositions.current[firstError] : undefined;
      if (y !== undefined) {
        scrollRef.current?.scrollToPosition(0, Math.max(y - 16, 0), true);
      }
    }

    return isValid;
  };

  // Save the updated profile information to Supabase
  const handleSave = async () => {
    if (!validateForm()) return;
    if (!profile?.user_id) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from("users")
        .update({
          gender: form.gender || null,
          street_address: form.streetAddress.trim() || null,
          barangay: form.barangay || null,
          city: form.city || null,
          province: form.province || null,
          // postal_code is int4 in DB
          postal_code: postalCode ? parseInt(postalCode, 10) : null,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", profile.user_id);

      if (error) throw error;

      setSuccessMessage("Your profile has been updated successfully.");
    } catch (err) {
      console.error("EditProfile: save error", err);
      setErrorMessage("Failed to update profile. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  // Loading State
  if (loading) {
    return (
      <ScreenWrapper header={<StandardHeader title="Edit Profile" />}>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" />
        </View>
      </ScreenWrapper>
    );
  }

  const handleAvatarUpload = () => {
    pickAndUpload("avatar", (url) => {
      updateForm({ profileImageUri: { uri: url } });
      setSuccessMessage("Profile picture updated successfully.");
    });
  };

  const handleBackgroundUpload = () => {
    pickAndUpload("background", (url) => {
      updateForm({ backgroundImageUri: { uri: url } });
      setSuccessMessage("Background picture updated successfully.");
    });
  };

  const hasBackgroundImage =
    form.backgroundImageUri !== null &&
    typeof form.backgroundImageUri === "object" &&
    "uri" in form.backgroundImageUri;

  const hasProfileImage =
    form.profileImageUri !== null &&
    typeof form.profileImageUri === "object" &&
    "uri" in form.profileImageUri;

  return (
    <ScreenWrapper
      scrollable
      ref={scrollRef}
      header={<StandardHeader title="Edit Profile" />}
      className="p-5"
    >
      {/* Profile Picture */}
      <View ref={contentRef}>
        <View className="flex gap-3">
          <View className="size-32 overflow-hidden rounded-full self-center border-2 border-border">
            {hasProfileImage ? (
              <Image
                source={form.profileImageUri!}
                style={{ width: "100%", height: "100%" }}
                resizeMode="cover"
              />
            ) : (
              <View className="size-32 rounded-full bg-surface flex items-center justify-center">
                <Text className="text-accent text-4xl font-interMedium">
                  {`${profile?.first_name?.[0] ?? ""}${profile?.last_name?.[0] ?? ""}`.toUpperCase()}
                </Text>
              </View>
            )}
          </View>
          <View className="mx-20">
            <Button
              size="sm"
              onPress={handleAvatarUpload}
              isDisabled={!!uploading}
            >
              <IconCamera size={16} color={colors.secondaryForeground} />
              <Button.Label>
                {uploading === "avatar" ? "Uploading..." : "Change Profile Picture"}
              </Button.Label>
              {uploading === "avatar" && (
                <Spinner
                  size="sm"
                  color={colors.secondaryForeground}
                  className="ml-2"
                />
              )}
            </Button>
          </View>
        </View>

        {/* Background Picture */}
        <View className="flex gap-3 mt-5">
          <View className="w-full h-40 overflow-hidden rounded-2xl self-center border-2 border-border">
            {hasBackgroundImage ? (
              <Image
                source={form.backgroundImageUri!}
                style={{ width: "100%", height: "100%" }}
                resizeMode="cover"
              />
            ) : (
              <View
                style={{ backgroundColor: colors.surface }}
                className="w-full h-full"
              />
            )}
          </View>
          <View className="mx-20">
            <Button
              size="sm"
              onPress={handleBackgroundUpload}
              isDisabled={!!uploading}
            >
              <IconCamera size={16} color={colors.secondaryForeground} />
              <Button.Label>
                {uploading === "background" ? "Uploading..." : "Change Background Picture"}
              </Button.Label>
              {uploading === "background" && (
                <Spinner
                  size="sm"
                  color={colors.secondaryForeground}
                  className="ml-2"
                />
              )}
            </Button>
          </View>
        </View>

        <Separator className="my-5" />

        {/* Personal Information */}
        <View className="flex gap-3">
          <View className="flex-row gap-2">
            <IconUser size={24} color={colors.textPrimary} />
            <Text className="text-foreground text-lg font-interSemiBold">
              Personal Information
            </Text>
          </View>

          {/* Read-only: names pre-filled from Google OAuth */}
          <TextField isRequired>
            <Label>First Name:</Label>
            <Input readOnly placeholder="First Name" value={form.firstName} />
          </TextField>

          <TextField isRequired>
            <Label>Last Name:</Label>
            <Input readOnly placeholder="Last Name" value={form.lastName} />
          </TextField>

          <TextField>
            <Label>Middle Name:</Label>
            <Input readOnly placeholder="Middle Name" value={form.middleName} />
          </TextField>

          {/* Editable: Gender */}
          <View ref={registerFieldRef("gender")}>
            <DropdownField
              label="Gender:"
              placeholder="Select Gender"
              bottomSheetLabel="Select Gender"
              options={GENDERS}
              value={form.gender}
              onSelect={(value) => updateForm({ gender: value ?? "" })}
              error={errors.gender}
            />
          </View>

          {/* Read-only: Date of Birth */}
          <DateField
            readOnly
            placeholder="Select Date of Birth"
            label="Date of Birth:"
            value={form.dateOfBirth ?? undefined}
            onChange={(date) => updateForm({ dateOfBirth: date })}
          />
        </View>

        <Separator className="my-5" />

        {/* Address Information */}
        <View className="flex gap-3">
          <View className="flex-row gap-2">
            <IconHome size={24} color={colors.textPrimary} />
            <Text className="text-foreground text-lg font-interSemiBold">
              Address Information
            </Text>
          </View>

          <View ref={registerFieldRef("province")}>
            <DropdownField
              label="Province:"
              placeholder="Select Province"
              bottomSheetLabel="Select Province"
              options={PROVINCES}
              value={form.province}
              onSelect={(value) => handleProvinceChange(value as Province | null)}
              searchPlaceholder="Search for Province..."
              enableSearch
              error={errors.province}
            />
          </View>

          <View ref={registerFieldRef("city")}>
            <DropdownField
              label="City:"
              placeholder="Select City"
              bottomSheetLabel="Select City"
              options={cities}
              value={form.city}
              onSelect={handleCityChange}
              searchPlaceholder="Search for City..."
              enableSearch
              disabled={!form.province}
              error={errors.city}
            />
          </View>

          <View ref={registerFieldRef("barangay")}>
            <DropdownField
              label="Barangay:"
              placeholder="Select Barangay"
              bottomSheetLabel="Select Barangay"
              options={barangays}
              value={form.barangay}
              onSelect={(value) => updateForm({ barangay: value ?? "" })}
              searchPlaceholder="Search for Barangay..."
              enableSearch
              disabled={!form.city}
              error={errors.barangay}
            />
          </View>

          {/* Auto-filled from city, but user can still correct it */}
          <View ref={registerFieldRef("postalCode")}>
            <TextField isRequired isInvalid={!!errors.postalCode}>
              <Label>Postal Code:</Label>
              <Input
                placeholder="Enter Postal Code"
                value={postalCode}
                onChangeText={handlePostalCodeChange}
                keyboardType='numeric'
              />
              {errors.postalCode && <FieldError>{errors.postalCode}</FieldError>}
            </TextField>
          </View>

          <View ref={registerFieldRef("streetAddress")}>
            <TextField isRequired isInvalid={!!errors.streetAddress}>
              <Label>Street Address:</Label>
              <Input
                placeholder="Enter Street Address"
                value={form.streetAddress}
                onChangeText={(text) => updateForm({ streetAddress: text })}
              />
              {errors.streetAddress && (
                <FieldError>{errors.streetAddress}</FieldError>
              )}
            </TextField>
          </View>
        </View>
      </View>

      {/* Save Button for the Fields */}
      <View className="mt-10 mb-5">
        <Button onPress={handleSave} isDisabled={saving}>
          <Button.Label>{saving ? "Saving..." : "Save Changes"}</Button.Label>
        </Button>
      </View>

      <ErrorDialog
        isOpen={!!errorMessage}
        onClose={() => setErrorMessage(null)}
        message={errorMessage}
      />

      <SuccessDialog
        isOpen={!!successMessage}
        onClose={() => setSuccessMessage(null)}
        message={successMessage}
      />
    </ScreenWrapper>
  );
}
