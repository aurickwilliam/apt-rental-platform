"use server";

import { createClient } from "@repo/supabase/server";
import { validateForm, calculateAgeFromBirthDate } from "../sign-up-form/utils";
import { SignUpFormData } from "../sign-up-form/types";

export interface SignUpFormState {
  error: string | null;
  success: boolean;
}

export async function signUp(
  _prevState: SignUpFormState,
  formData: FormData,
): Promise<SignUpFormState> {
  try {
    const mapped: SignUpFormData = {
      email: formData.get("email") as string,
      firstName: formData.get("firstName") as string,
      lastName: formData.get("lastName") as string,
      middleName: formData.get("middleName") as string,
      birthDate: formData.get("birthDate") as string,
      gender: formData.get("gender") as string,
      mobileNumber: formData.get("mobileNumber") as string,
      streetAddress: formData.get("streetAddress") as string,
      barangay: formData.get("barangay") as string,
      city: formData.get("city") as string,
      stateProvince: formData.get("stateProvince") as string,
      postalCode: Number(formData.get("postalCode")) || undefined,
      password: formData.get("password") as string,
      confirmPassword: formData.get("confirmPassword") as string,
    };

    const validationError = validateForm(mapped);
    if (validationError) {
      return { error: validationError, success: false };
    }

    const userId = formData.get("userId") as string;
    if (!userId) {
      return {
        error: "Session not found. Please try verifying your email again.",
        success: false,
      };
    }

    const parsedBirthDate = new Date(`${mapped.birthDate}T00:00:00`);
    const calculatedAge = calculateAgeFromBirthDate(parsedBirthDate);
    const parsedPostalCode = Number(mapped.postalCode);

    const supabase = await createClient();

    const { error: insertError } = await supabase.from("users").insert({
      user_id: userId,
      email: mapped.email,
      role: (formData.get("role") as string) || "tenant",
      first_name: mapped.firstName,
      last_name: mapped.lastName,
      middle_name: mapped.middleName || null,
      age: calculatedAge,
      gender: mapped.gender,
      mobile_number: mapped.mobileNumber,
      birth_date: mapped.birthDate,
      street_address: mapped.streetAddress,
      barangay: mapped.barangay,
      city: mapped.city,
      province: mapped.stateProvince,
      postal_code: parsedPostalCode,
    });

    if (insertError) {
      if (insertError.code === "23505") {
        return {
          error: "An account with this email already exists. Please sign in instead.",
          success: false,
        };
      }
      return {
        error: "We could not create your account profile. Please check your details and try again.",
        success: false,
      };
    }

    return { error: null, success: true };

  } catch (error) {
    console.error("Unexpected error during sign-up:", error);
    return {
      error: "An unexpected error occurred. Please try again later.",
      success: false,
    };
  }
}