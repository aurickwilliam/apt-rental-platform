"use server";

import { createClient } from "@repo/supabase/server";

export interface SignUpFormState {
  error: string | null;
  success: boolean;
}

export async function signUp(
  prevState: SignUpFormState,
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
  const stateProvince = formData.get("stateProvince") as string | null;
  const postalCode = formData.get("postalCode") as string | null;

  // Validation
  if (!email || !password || !confirmPassword) {
    return { error: "Email, password, and password confirmation are required.", success: false };
  }

  if (!firstName || !lastName) {
    return { error: "First name and last name are required.", success: false };
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

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        role: role || "tenant",
        first_name: firstName,
        last_name: lastName,
        middle_name: middleName || "",
        age: age ? parseInt(age, 10) : null,
        gender: gender || "",
        mobile_number: mobileNumber || "",
        street_address: streetAddress || "",
        barangay: barangay || "",
        city: city || "",
        state_province: stateProvince || "",
        postal_code: postalCode || "",
      },
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/auth/callback`,
    },
  });

  if (error) {
    if (error.message.includes("already registered") || error.message.includes("already been registered")) {
      return { error: "An account with this email already exists. Please sign in instead.", success: false };
    }
    if (error.message.includes("rate limit")) {
      return { error: "Too many sign-up attempts. Please try again later.", success: false };
    }
    if (error.message.includes("password")) {
      return { error: "Password does not meet the security requirements. Please choose a stronger password.", success: false };
    }
    return { error: error.message, success: false };
  }

  // If email confirmation is enabled in Supabase, the user needs to verify their email.
  // Return success so the UI can show a "check your email" message.
  return { error: null, success: true };
}
