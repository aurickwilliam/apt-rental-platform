"use server";

import { createClient } from "@repo/supabase/server";

function calculateAgeFromBirthDate(birthDate: Date): number {
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();

  if (
    monthDiff < 0 ||
    (monthDiff === 0 && today.getDate() < birthDate.getDate())
  ) {
    age -= 1;
  }

  return age;
}

export interface SignUpFormState {
  error: string | null;
  success: boolean;
}

export async function signUp(
  _prevState: SignUpFormState,
  formData: FormData,
): Promise<SignUpFormState> {
  
  try {
    const role = formData.get("role") as string;
    const password = formData.get("password") as string | null;
    const confirmPassword = formData.get("confirmPassword") as string | null;

    // Personal information
    const firstName = formData.get("firstName") as string;
    const lastName = formData.get("lastName") as string;
    const middleName = formData.get("middleName") as string | null;
    const birthDate = formData.get("birthDate") as string | null;
    const gender = formData.get("gender") as string | null;
    const mobileNumber = formData.get("mobileNumber") as string | null;

    // Address information
    const streetAddress = formData.get("streetAddress") as string | null;
    const barangay = formData.get("barangay") as string | null;
    const city = formData.get("city") as string | null;
    const province = formData.get("stateProvince") as string | null;
    const postalCode = formData.get("postalCode") as string | null;

    // Validation
    if (!firstName || !lastName) {
      return {
        error: "First name and last name are required.",
        success: false,
      };
    }

    if (!password || !confirmPassword) {
      return {
        error: "Password and confirm password are required.",
        success: false,
      };
    }

    if (password.length < 8) {
      return {
        error: "Password must be at least 8 characters long.",
        success: false,
      };
    }

    if (password !== confirmPassword) {
      return { error: "Passwords do not match.", success: false };
    }

    if (!birthDate || !gender || !mobileNumber) {
      return {
        error: "Birth date, gender, and mobile number are required.",
        success: false,
      };
    }

    if (!streetAddress || !barangay || !city || !province || !postalCode) {
      return {
        error: "Complete address information is required.",
        success: false,
      };
    }

    const parsedBirthDate = new Date(`${birthDate}T00:00:00`);
    if (
      Number.isNaN(parsedBirthDate.getTime()) ||
      parsedBirthDate > new Date()
    ) {
      return { error: "Please enter a valid birth date.", success: false };
    }

    const calculatedAge = calculateAgeFromBirthDate(parsedBirthDate);
    if (calculatedAge < 0 || calculatedAge > 120) {
      return { error: "Please enter a valid birth date.", success: false };
    }

    const parsedPostalCode = Number.parseInt(postalCode, 10);
    if (Number.isNaN(parsedPostalCode)) {
      return { error: "Please enter a valid postal code.", success: false };
    }

    const supabase = await createClient();

    const userId = formData.get("userId") as string;
    if (!userId) {
      return {
        error: "Session not found. Please try verifying your email again.",
        success: false,
      };
    }

    // Insert the profile row into public.users
    const { error: insertError } = await supabase.from("users").insert({
      user_id: userId,
      email: formData.get("email") as string,
      role: role || "tenant",
      first_name: firstName,
      last_name: lastName,
      middle_name: middleName || null,
      age: calculatedAge,
      gender,
      mobile_number: mobileNumber,
      birth_date: birthDate,
      street_address: streetAddress,
      barangay,
      city,
      province,
      postal_code: parsedPostalCode,
    });

    if (insertError) {
      if (insertError.code === "23505") {
        return {
          error:
            "An account with this email already exists. Please sign in instead.",
          success: false,
        };
      }
      return {
        error:
          "We could not create your account profile. Please check your details and try again.",
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
