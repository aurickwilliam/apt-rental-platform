import { supabase, type Database } from "@repo/supabase";

import { setPrivateMediaCacheUser } from "../media/privateMediaResolver";

export type UserProfile = Pick<
  Database["public"]["Tables"]["users"]["Row"],
  | "id"
  | "user_id"
  | "first_name"
  | "last_name"
  | "middle_name"
  | "email"
  | "mobile_number"
  | "avatar_url"
  | "account_status"
  | "background_url"
  | "role"
  | "gender"
  | "birth_date"
  | "street_address"
  | "barangay"
  | "city"
  | "province"
  | "postal_code"
>;

const USER_PROFILE_FIELDS =
  "id, user_id, first_name, last_name, middle_name, email, mobile_number, avatar_url, account_status, background_url, role, gender, birth_date, street_address, barangay, city, province, postal_code";

async function getUserProfileByColumn(
  column: "id" | "user_id",
  value: string,
): Promise<UserProfile | null> {
  const { data, error } = await supabase
    .from("users")
    .select(USER_PROFILE_FIELDS)
    .eq(column, value)
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export function getUserProfileById(userId: string): Promise<UserProfile | null> {
  return getUserProfileByColumn("id", userId);
}

export async function getCurrentUser(): Promise<UserProfile | null> {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) {
    throw error;
  }

  if (!user) {
    setPrivateMediaCacheUser(null);
    return null;
  }

  setPrivateMediaCacheUser(user.id);
  return getUserProfileByColumn("user_id", user.id);
}
