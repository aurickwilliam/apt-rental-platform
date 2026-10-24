"use server";

import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createClient } from "@repo/supabase/server";
import { PORTAL_COOKIE } from "@/lib/portal-preference";
import type { Database } from "@repo/supabase";
import { GENDERS, validatePHMobile } from "@repo/constants";
import { validateBirthDate } from "@/lib/birth-date";

export type CompleteProfileState = {
  error?: string;
};

interface UserRolesProfile {
  mobile_number: string | null;
  roles: string[];
  account_status: string;
}

export async function completeProfile(
  _: CompleteProfileState,
  formData: FormData
): Promise<CompleteProfileState> {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) return { error: "Unauthorized." };

  const firstName = formData.get("first_name") as string;
  const lastName = formData.get("last_name") as string;
  const middleName = formData.get("middle_name") as string | null;
  const gender = formData.get("gender") as string;
  const mobileNumber = formData.get("mobile_number") as string;
  const birthDate = formData.get("birth_date") as string;
  const streetAddress = formData.get("street_address") as string;
  const barangay = formData.get("barangay") as string;
  const city = formData.get("city") as string;
  const province = formData.get("province") as string;
  const requestedRole = formData.get("role");
  const role =
    requestedRole === "landlord" || requestedRole === "tenant"
      ? requestedRole
      : "tenant";

  // maybeSingle: a confirmed account whose profile was never saved (sign-up
  // interrupted after the email code) has no row yet and finishes here too.
  const { data: profileData, error: profileError } = await supabase
    .from("users")
    .select("roles, mobile_number, account_status")
    .eq("user_id", user.id)
    .maybeSingle();
  const profile = profileData as unknown as UserRolesProfile | null;
  if (profileError) {
    console.error("Could not load profile for completion", profileError);
    return { error: "Could not load your profile. Please try again." };
  }

  // A suspended account's profile is hidden by RLS, so "no row" is only an
  // unfinished sign-up when the account is not suspended.
  if (!profile) {
    const { data: suspension } = await supabase.rpc("get_my_suspension_status");
    if ((suspension as { suspended?: boolean } | null)?.suspended) redirect("/suspended");
  }

  if (
    profile &&
    (profile.roles.includes("admin") ||
      profile.mobile_number ||
      profile.account_status !== "unverified")
  ) {
    return { error: "Profile setup is no longer available for this account." };
  }
  const postalCode = formData.get("postal_code")
    ? Number(formData.get("postal_code"))
    : null;

  const requiredFields: Record<string, string> = {
    "First Name": firstName,
    "Last Name": lastName,
    "Gender": gender,
    "Mobile Number": mobileNumber,
    "Birth Date": birthDate,
    "Street Address": streetAddress,
    "Barangay": barangay,
    "City": city,
    "Province": province,
  };

  const missingField = Object.entries(requiredFields).find(
    ([, value]) => !value?.trim()
  );
  if (missingField) {
    return { error: `${missingField[0]} is required.` };
  }

  const birthDateError = validateBirthDate(birthDate);
  if (birthDateError) return { error: birthDateError };

  if (!GENDERS.includes(gender)) return { error: "Please choose a valid gender." };

  const mobile = validatePHMobile(mobileNumber);
  if (!mobile.formattedNumber) return { error: mobile.errorMessage ?? "Enter a valid mobile number." };

  if (postalCode !== null && !Number.isInteger(postalCode)) {
    return { error: "Please enter a valid postal code." };
  }

  const details = {
    first_name: firstName,
    last_name: lastName,
    middle_name: middleName || null,
    gender,
    mobile_number: mobile.formattedNumber,
    birth_date: birthDate,
    street_address: streetAddress,
    barangay,
    city,
    province,
    postal_code: postalCode,
  };

  if (!profile) {
    if (!user.email) return { error: "Could not verify your account. Please sign in again." };
    // Same write as sign-up: own row, tenant/landlord role, email = Auth email.
    const { error: insertError } = await supabase.from("users").insert({
      user_id: user.id,
      email: user.email,
      roles: [role],
      ...details,
    } as unknown as Database["public"]["Tables"]["users"]["Insert"]);
    if (insertError) return { error: insertError.message };
  } else {
    const { error: roleError } = await supabase.rpc("set_onboarding_role", {
      requested_role: role,
    });
    if (roleError) return { error: "Could not select your account type. Please try again." };

    const { error } = await supabase.from("users").update(details).eq("user_id", user.id);
    if (error) return { error: error.message };
  }

  (await cookies()).set(PORTAL_COOKIE, role, { sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 60 * 60 * 24 * 30 });
  if (role === "landlord") redirect("/landlord/dashboard");
  // Fresh tenants are offered rental personalization once; the personalize
  // page itself skips returning users, so this never traps anyone.
  redirect("/tenant/personalize?fresh=1");
}
