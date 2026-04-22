"use server";

import { redirect } from "next/navigation";
import { createClient } from "@repo/supabase/server";

export type CompleteProfileState = {
  error?: string;
};

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
  const age = Number(formData.get("age"));
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
      account_status: "verified",
    })
    .eq("user_id", user.id);

  if (error) return { error: error.message };

  redirect(role === "landlord" ? "/landlord/dashboard" : "/tenant/my-rental");
}