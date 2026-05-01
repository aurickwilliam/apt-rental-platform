"use server";

import { redirect } from "next/navigation";
import { createClient } from "@repo/supabase/server";

export type CompleteProfileState = {
  error?: string;
};

function calculateAgeFromBirthDate(birthDateValue: string): number | null {
  // Use only the date portion to avoid timezone-based day shifts.
  const isoDate = birthDateValue?.slice(0, 10);
  if (!isoDate) return null;

  const birthDate = new Date(`${isoDate}T00:00:00Z`);
  if (Number.isNaN(birthDate.getTime())) return null;

  const today = new Date();
  const thisYearBirthday = new Date(
    Date.UTC(
      today.getUTCFullYear(),
      birthDate.getUTCMonth(),
      birthDate.getUTCDate()
    )
  );

  let age = today.getUTCFullYear() - birthDate.getUTCFullYear();
  if (Date.now() < thisYearBirthday.getTime()) age -= 1;

  return age >= 0 ? age : null;
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
  const age = calculateAgeFromBirthDate(birthDate);

  if (age === null) return { error: "Invalid birth date." };

  const streetAddress = formData.get("street_address") as string;
  const barangay = formData.get("barangay") as string;
  const city = formData.get("city") as string;
  const province = formData.get("province") as string;
  const requestedRole = formData.get("role");
  const role =
    requestedRole === "landlord" || requestedRole === "tenant"
      ? requestedRole
      : "tenant";
  const postalCode = formData.get("postal_code")
    ? Number(formData.get("postal_code"))
    : null;

  const { error } = await supabase
    .from("users")
    .update({
      first_name: firstName,
      last_name: lastName,
      middle_name: middleName || null,
      age,
      gender,
      mobile_number: mobileNumber,
      birth_date: birthDate,
      street_address: streetAddress,
      barangay,
      city,
      province,
      role,
      postal_code: postalCode,
    })
    .eq("user_id", user.id);

  if (error) return { error: error.message };

  redirect(role === "landlord" ? "/landlord/dashboard" : "/tenant/my-rental");
}