"use server";

import { createClient } from "@repo/supabase/server";

export interface SignUpFormState {
  error: string | null;
  success: boolean;
}

export async function signUp(
  _prevState: SignUpFormState,
  formData: FormData
): Promise<SignUpFormState> {
  const role = formData.get("role") as string;
  const password = formData.get("password") as string | null;
  const confirmPassword = formData.get("confirmPassword") as string | null;

  // Personal information
  const firstName = formData.get("firstName") as string;
  const lastName = formData.get("lastName") as string;
  const middleName = formData.get("middleName") as string | null;
  const age = formData.get("age") as string | null;
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
    return { error: "First name and last name are required.", success: false };
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

  if (!age || !gender || !mobileNumber) {
    return { error: "Age, gender, and mobile number are required.", success: false };
  }

  if (!streetAddress || !barangay || !city || !province || !postalCode) {
    return { error: "Complete address information is required.", success: false };
  }

  const parsedAge = Number.parseInt(age, 10);
  if (Number.isNaN(parsedAge) || parsedAge <= 0 || parsedAge > 120) {
    return { error: "Please enter a valid age.", success: false };
  }

  const parsedPostalCode = Number.parseInt(postalCode, 10);
  if (Number.isNaN(parsedPostalCode)) {
    return { error: "Please enter a valid postal code.", success: false };
  }

  const supabase = await createClient();

  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    return { error: "Session not found. Please try verifying your email again.", success: false };
  }

  const birthYear = new Date().getFullYear() - parsedAge;
  const derivedBirthDate = `${birthYear}-01-01`;

  // Insert the profile row into public.users
  const { error: insertError } = await supabase
    .from("users")
    .insert({
      user_id: user.id,
      role: role || "tenant",
      first_name: firstName,
      last_name: lastName,
      middle_name: middleName || null,
      age: parsedAge,
      gender,
      mobile_number: mobileNumber,
      birth_date: derivedBirthDate,
      street_address: streetAddress,
      barangay,
      city,
      province,
      postal_code: parsedPostalCode,
    });

  if (insertError) {
    if (insertError.code === "23505") {
      return { error: "An account with this email already exists. Please sign in instead.", success: false };
    }
    return { error: "We could not create your account profile. Please check your details and try again.", success: false };
  }

  return { error: null, success: true };
}