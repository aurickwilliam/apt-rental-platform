import { useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { usePHMobileValidation, usePHPostalCode } from "@repo/hooks";
import { GENDERS, getPostalCode } from "@repo/constants";
import { describeAuthError } from "@repo/utils";

import type { UserProfile } from "@/service/auth/currentUserService";
import {
  editableProfileSnapshot,
  pickProfilePhoto,
  PROFILE_FIELD_ORDER,
  ProfileEditError,
  saveProfile,
  type ProfileField,
  type ProfilePhotos,
  type ProfilePhotoTarget,
} from "@/service/auth/profileService";
import { CURRENT_USER_QUERY_KEY } from "@/utils/queryClient";

type AddressField = "street_address" | "province" | "city" | "barangay";
type FormField = AddressField | "gender";
export type ProfileFormErrors = Partial<Record<ProfileField, string>>;

const REQUIRED_MESSAGES: Record<FormField, string> = {
  gender: "Gender is required.",
  street_address: "Street address is required.",
  province: "Province is required.",
  city: "City is required.",
  barangay: "Barangay is required.",
};

export function useEditProfile(initial: UserProfile) {
  const queryClient = useQueryClient();
  const [baseline, setBaseline] = useState(() => editableProfileSnapshot(initial));
  const [form, setForm] = useState(() => ({
    gender: baseline.gender,
    street_address: baseline.street_address,
    province: baseline.province,
    city: baseline.city,
    barangay: baseline.barangay,
  }));
  const mobile = usePHMobileValidation(baseline.mobile_number);
  const postal = usePHPostalCode({ defaultValue: baseline.postal_code });
  const [photos, setPhotos] = useState<ProfilePhotos>({ avatar: null, background: null });
  const [picking, setPicking] = useState<ProfilePhotoTarget | null>(null);
  const [errors, setErrors] = useState<ProfileFormErrors>({});
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [succeeded, setSucceeded] = useState(false);
  // Locks synchronously, even before React renders the pending state.
  const busyRef = useRef(false);

  const fields = { ...form, mobile_number: mobile.value, postal_code: postal.value };
  // The field shows "0917 123 4567"; the saved profile holds 09171234567.
  const comparable = { ...fields, mobile_number: mobile.validation.formattedNumber ?? mobile.value };
  const dirty = PROFILE_FIELD_ORDER.some((field) => comparable[field] !== baseline[field]) ||
    photos.avatar !== null || photos.background !== null;

  const mutation = useMutation({
    mutationFn: saveProfile,
    onSuccess: (saved) => {
      const next = editableProfileSnapshot(saved);
      setBaseline(next);
      setForm({
        gender: next.gender, street_address: next.street_address,
        province: next.province, city: next.city, barangay: next.barangay,
      });
      mobile.onChange(next.mobile_number);
      postal.setValue(next.postal_code);
      setPhotos({ avatar: null, background: null });
      queryClient.setQueryData<UserProfile | null>(CURRENT_USER_QUERY_KEY, (cached) =>
        cached?.user_id === initial.user_id ? { ...cached, ...saved } : cached,
      );
      setSucceeded(true);
      void queryClient.invalidateQueries({ queryKey: CURRENT_USER_QUERY_KEY, exact: true })
        .catch(() => console.error("Unable to refresh saved profile"));
    },
  });

  const clearError = (field: ProfileField) => {
    setErrors((previous) => ({ ...previous, [field]: undefined }));
    setErrorMessage(null);
  };

  const updateField = (field: FormField, value: string) => {
    if (busyRef.current || succeeded) return;
    setForm((previous) => ({ ...previous, [field]: value }));
    clearError(field);
    if (field === "province") {
      setForm((previous) => ({ ...previous, city: "", barangay: "" }));
      postal.setValue("");
      clearError("city");
      clearError("barangay");
      clearError("postal_code");
    } else if (field === "city") {
      setForm((previous) => ({ ...previous, barangay: "" }));
      postal.setValue(getPostalCode(value, form.province) ?? "");
      clearError("barangay");
      clearError("postal_code");
    }
  };

  const validateField = (field: ProfileField): string | undefined => {
    if (field === "mobile_number") return mobile.validate().errorMessage ?? undefined;
    if (field === "postal_code") {
      return postal.validate() ? undefined : postal.value
        ? "Enter a valid 4-digit PH ZIP code (1000–9999)."
        : "Postal code is required.";
    }
    if (!form[field].trim()) return REQUIRED_MESSAGES[field];
    if (field === "gender" && !GENDERS.includes(form.gender)) return "Invalid gender.";
    return undefined;
  };

  const handleFailure = (error: unknown, fallback: string) => {
    if (error instanceof ProfileEditError) {
      setErrorMessage(error.message);
    } else {
      // Never log backend messages: they can echo phone numbers or addresses.
      console.error("Profile edit failed:", describeAuthError(error));
      setErrorMessage(fallback);
    }
  };

  const pickPhoto = async (target: ProfilePhotoTarget) => {
    if (busyRef.current || succeeded) return;
    busyRef.current = true;
    setPicking(target);
    setErrorMessage(null);
    try {
      const photo = await pickProfilePhoto(target);
      if (photo) setPhotos((previous) => ({ ...previous, [target]: photo }));
    } catch (error) {
      handleFailure(error, "Couldn't open your photos. Please try again.");
    } finally {
      busyRef.current = false;
      setPicking(null);
    }
  };

  // Returns the first invalid field so presentation can scroll to it.
  const save = async (): Promise<ProfileField | null> => {
    if (busyRef.current || succeeded || !dirty) return null;
    const nextErrors: ProfileFormErrors = {};
    for (const field of PROFILE_FIELD_ORDER) {
      const message = validateField(field);
      if (message) nextErrors[field] = message;
    }
    setErrors(nextErrors);
    const firstError = PROFILE_FIELD_ORDER.find((field) => nextErrors[field]);
    if (firstError) return firstError;

    busyRef.current = true;
    setErrorMessage(null);
    try {
      await mutation.mutateAsync({
        authUserId: initial.user_id,
        fields: comparable,
        photos,
      });
    } catch (error) {
      handleFailure(error, "Couldn't save your profile. Please try again.");
    } finally {
      busyRef.current = false;
    }
    return null;
  };

  return {
    fields, photos, errors, dirty, succeeded, picking,
    saving: mutation.isPending,
    busy: mutation.isPending || picking !== null,
    busyRef, errorMessage, setErrorMessage, updateField, pickPhoto, save,
    blurField: (field: ProfileField) => {
      const message = validateField(field);
      setErrors((previous) => ({ ...previous, [field]: message }));
    },
    changeMobile: (value: string) => {
      if (busyRef.current || succeeded) return;
      mobile.onChange(value);
      clearError("mobile_number");
    },
    changePostal: (value: string) => {
      if (busyRef.current || succeeded) return;
      postal.handleChange(value);
      clearError("postal_code");
    },
  };
}
