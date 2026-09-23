"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@repo/supabase/server";
import { GENDERS } from "@repo/constants";

export type UpdateProfileState = {
  error?: string;
  success?: string;
};

export async function updateProfile(
  _: UpdateProfileState,
  formData: FormData
): Promise<UpdateProfileState> {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) return { error: "Unauthorized. Please sign in again." };

  const gender = ((formData.get("gender") as string) ?? "").trim();
  const mobileNumber = ((formData.get("mobile_number") as string) ?? "").trim();
  const streetAddress = ((formData.get("street_address") as string) ?? "").trim();
  const barangay = ((formData.get("barangay") as string) ?? "").trim();
  const city = ((formData.get("city") as string) ?? "").trim();
  const province = ((formData.get("province") as string) ?? "").trim();
  const postalCodeRaw = ((formData.get("postal_code") as string) ?? "").trim();

  const requiredFields: Record<string, string> = {
    Gender: gender,
    "Mobile Number": mobileNumber,
    "Street Address": streetAddress,
    Barangay: barangay,
    City: city,
    Province: province,
    "Postal Code": postalCodeRaw,
  };

  const missing = Object.entries(requiredFields).find(([, v]) => !v);
  if (missing) return { error: `${missing[0]} is required.` };

  if (!GENDERS.includes(gender)) return { error: "Invalid gender." };

  if (!/^09\d{9}$/.test(mobileNumber)) {
    return { error: "Mobile number must be 11 digits starting with 09." };
  }

  if (!/^\d{4}$/.test(postalCodeRaw)) {
    return { error: "Postal code must be 4 digits." };
  }
  const postalCode = Number(postalCodeRaw);
  if (postalCode < 1000 || postalCode > 9999) {
    return { error: "Postal code must be between 1000 and 9999." };
  }

  const { error } = await supabase
    .from("users")
    .update({
      gender,
      mobile_number: mobileNumber,
      street_address: streetAddress,
      barangay,
      city,
      province,
      postal_code: postalCode,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", user.id);

  if (error) return { error: error.message };

  revalidatePath("/tenant/profile");
  revalidatePath("/landlord/profile");

  return { success: "Profile updated." };
}
