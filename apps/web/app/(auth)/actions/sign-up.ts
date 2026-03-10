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

  // Create the auth user in Authentication
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        role: role || "tenant",
        first_name: firstName,
        last_name: lastName,
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
    return { error: authError.message, success: false };
  }

  // Insert profile data into the users table
  if (authData.user) {
    const { error: profileError } = await supabase
      .from("users")
      .insert({
        user_id: authData.user.id,
        role: role || "tenant",
        first_name: firstName,
        last_name: lastName,
        middle_name: middleName || null,
        age: age ? parseInt(age, 10) : 0,
        mobile_number: mobileNumber || "",
        birth_date: new Date().toISOString().split("T")[0],
        street_address: streetAddress || "",
        barangay: barangay || "",
        city: city || "",
        province: province || "",
        postal_code: postalCode ? parseInt(postalCode, 10) : null,
      });

    if (profileError) {
      // If profile creation fails, we should clean up the auth user
      // to avoid orphaned accounts
      await supabase.auth.admin.deleteUser(authData.user.id);

      console.error("Profile creation error:", profileError);
      return { error: "Failed to create your profile. Please try again.", success: false };
    }
  }

  return { error: null, success: true };
}
