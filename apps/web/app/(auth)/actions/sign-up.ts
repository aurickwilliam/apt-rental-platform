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
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const confirmPassword = formData.get("confirmPassword") as string;
  const role = formData.get("role") as string;

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
  if (!email || !password || !confirmPassword) {
    return { error: "Email, password, and password confirmation are required.", success: false };
  }

  if (!firstName || !lastName) {
    return { error: "First name and last name are required.", success: false };
  }

  if (!age || !gender || !mobileNumber) {
    return { error: "Age, gender, and mobile number are required.", success: false };
  }

  if (!streetAddress || !barangay || !city || !province || !postalCode) {
    return { error: "Complete address information is required.", success: false };
  }

  if (password !== confirmPassword) {
    return { error: "Passwords do not match.", success: false };
  }

  if (password.length < 8) {
    return { error: "Password must be at least 8 characters long.", success: false };
  }

  // Validate password strength
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecialChar = /[^A-Za-z0-9]/.test(password);

  if (!hasUppercase || !hasLowercase) {
    return { error: "Password must contain both uppercase and lowercase letters.", success: false };
  }

  if (!hasNumber) {
    return { error: "Password must include at least one number.", success: false };
  }

  if (!hasSpecialChar) {
    return { error: "Password must contain at least one special character.", success: false };
  }

  const supabase = await createClient();

  const parsedAge = Number.parseInt(age, 10);
  if (Number.isNaN(parsedAge) || parsedAge <= 0 || parsedAge > 120) {
    return { error: "Please enter a valid age.", success: false };
  }

  const parsedPostalCode = Number.parseInt(postalCode, 10);
  if (Number.isNaN(parsedPostalCode)) {
    return { error: "Please enter a valid postal code.", success: false };
  }

  // Web sign-up collects age but not birth date. Derive a stable default date
  // so auth metadata satisfies DB profile trigger requirements.
  const birthYear = new Date().getFullYear() - parsedAge;
  const derivedBirthDate = `${birthYear}-01-01`;

  // Create the auth user in Authentication
  const { error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
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
      },
    },
  });

  if (authError) {
    if (authError.message.includes("already registered") || authError.message.includes("already been registered")) {
      return { error: "An account with this email already exists. Please sign in instead.", success: false };
    }
    if (authError.message.includes("rate limit")) {
      return { error: "Too many sign-up attempts. Please try again later.", success: false };
    }
    if (authError.message.includes("password")) {
      return { error: "Password does not meet the security requirements. Please choose a stronger password.", success: false };
    }
    if (authError.message.toLowerCase().includes("database error saving new user")) {
      return { error: "We could not create your account profile. Please check your details and try again.", success: false };
    }
    return { error: authError.message, success: false };
  }

  return { error: null, success: true };
}
