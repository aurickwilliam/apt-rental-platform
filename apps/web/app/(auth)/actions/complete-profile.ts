"use server";

import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createClient } from "@repo/supabase/server";
import { PORTAL_COOKIE } from "@/lib/portal-preference";
import { GENDERS, validatePHMobile } from "@repo/constants";
import { getBirthDateDatabaseError, validateBirthDate } from "@/lib/birth-date";
import { validateRegistrationAddress, type RegistrationAddress, type RegistrationAddressErrors } from "@/lib/registration-address";
import { getRegistrationAcceptanceErrors, readRegistrationAcceptance, validateRegistrationAcceptance, type AcceptanceErrors } from "@/lib/registration-policies";
import { completeWebRegistration } from "@/service/registrationService";

export type CompleteProfileState = {
  error?: string;
  birthDateError?: string;
  birthDate?: string;
  addressErrors?: RegistrationAddressErrors;
  address?: RegistrationAddress;
  acceptanceErrors?: AcceptanceErrors;
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
  const readAddress = (name: string) => {
    const value = formData.get(name);
    return typeof value === "string" ? value : "";
  };
  const address: RegistrationAddress = {
    province: readAddress("province"), city: readAddress("city"), barangay: readAddress("barangay"),
    streetAddress: readAddress("street_address"), postalCode: readAddress("postal_code"),
  };
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
  const birthDateError = validateBirthDate(birthDate);
  if (birthDateError) return { birthDateError, birthDate: birthDate ?? "" };
  const requiredFields: Record<string, string> = {
    "First Name": firstName,
    "Last Name": lastName,
    "Gender": gender,
    "Mobile Number": mobileNumber,
  };

  const missingField = Object.entries(requiredFields).find(
    ([, value]) => !value?.trim()
  );
  if (missingField) {
    return { error: `${missingField[0]} is required.` };
  }

  if (!GENDERS.includes(gender)) return { error: "Please choose a valid gender." };

  const mobile = validatePHMobile(mobileNumber);
  if (!mobile.formattedNumber) return { error: mobile.errorMessage ?? "Enter a valid mobile number." };

  const addressErrors = validateRegistrationAddress(address);
  if (Object.keys(addressErrors).length) return { addressErrors, address };
  if (requestedRole !== "tenant" && requestedRole !== "landlord") return { error: "Please choose a valid account type." };
  const acceptance = readRegistrationAcceptance(formData);
  const acceptanceErrors = validateRegistrationAcceptance(acceptance);
  if (Object.keys(acceptanceErrors).length) return { acceptanceErrors };

  const details = {
    first_name: firstName,
    last_name: lastName,
    middle_name: middleName || null,
    gender,
    mobile_number: mobile.formattedNumber,
    birth_date: birthDate,
    street_address: address.streetAddress,
    barangay: address.barangay,
    city: address.city,
    province: address.province,
    postal_code: Number(address.postalCode),
  };

  const { error } = await completeWebRegistration(supabase, details, role, acceptance, "web_profile_completion");
  if (error) {
    const acceptanceErrors = getRegistrationAcceptanceErrors(error);
    if (acceptanceErrors) return { acceptanceErrors };
    const birthDateError = getBirthDateDatabaseError(error);
    if (birthDateError) return { birthDateError, birthDate };
    return { error: error.code === "P0001" ? error.message : "We could not complete your registration. Please try again." };
  }

  (await cookies()).set(PORTAL_COOKIE, role, { sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 60 * 60 * 24 * 30 });
  if (role === "landlord") redirect("/landlord/dashboard");
  // Fresh tenants are offered rental personalization once; the personalize
  // page itself skips returning users, so this never traps anyone.
  redirect("/tenant/personalize?fresh=1");
}
