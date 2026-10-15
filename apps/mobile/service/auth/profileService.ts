import * as Crypto from "expo-crypto";
import * as ImagePicker from "expo-image-picker";
import { File } from "expo-file-system";
import { supabase } from "@repo/supabase";

import type { UserProfile } from "./currentUserService";
import {
  compressImageTo,
  PROFILE_AVATAR_MAX_LONG_EDGE,
  PROFILE_BACKGROUND_MAX_LONG_EDGE,
  PROFILE_QUALITY,
} from "@/utils/compressImage";

export interface EditableProfileFields {
  mobile_number: string;
  gender: string;
  street_address: string;
  province: string;
  city: string;
  barangay: string;
  postal_code: string;
}

export type ProfileField = keyof EditableProfileFields;
export const PROFILE_FIELD_ORDER: ProfileField[] = [
  "mobile_number", "gender", "street_address", "province", "city", "barangay", "postal_code",
];

export type ProfilePhotoTarget = "avatar" | "background";
export type ProfilePhoto = Pick<ImagePicker.ImagePickerAsset, "uri" | "width" | "height">;
export type ProfilePhotos = Record<ProfilePhotoTarget, ProfilePhoto | null>;
export type SavedProfile = Pick<UserProfile, ProfileField | "avatar_url" | "background_url">;

const PHOTO_BUCKETS: Record<ProfilePhotoTarget, string> = {
  avatar: "avatars",
  background: "background_photos",
};

// These messages are app-owned; raw backend messages can contain profile data.
export class ProfileEditError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ProfileEditError";
  }
}

export function editableProfileSnapshot(profile: SavedProfile): EditableProfileFields {
  return {
    mobile_number: profile.mobile_number ?? "",
    gender: profile.gender ?? "",
    street_address: profile.street_address ?? "",
    province: profile.province ?? "",
    city: profile.city ?? "",
    barangay: profile.barangay ?? "",
    postal_code: profile.postal_code != null ? String(profile.postal_code) : "",
  };
}

// Selection is local only. Compression, uploads and profile writes happen on Save.
export async function pickProfilePhoto(target: ProfilePhotoTarget): Promise<ProfilePhoto | null> {
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (status !== "granted") {
    throw new ProfileEditError("Permission to access photos is required.");
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ["images"],
    allowsEditing: true,
    aspect: target === "avatar" ? [1, 1] : [16, 9],
    quality: PROFILE_QUALITY,
    exif: false,
  });
  if (result.canceled) return null;
  const asset = result.assets[0];
  if (!asset) throw new ProfileEditError("Couldn't open that photo. Please choose another image.");
  return { uri: asset.uri, width: asset.width, height: asset.height };
}

interface SaveProfileInput {
  authUserId: string;
  fields: EditableProfileFields;
  photos: ProfilePhotos;
}

export async function saveProfile({ authUserId, fields, photos }: SaveProfileInput): Promise<SavedProfile> {
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user || user.id !== authUserId) {
    throw new ProfileEditError("Please sign in again before updating your profile.");
  }

  const photoUrls: Partial<Pick<SavedProfile, "avatar_url" | "background_url">> = {};
  const uploaded: { bucket: string; path: string }[] = [];
  let profileWriteStarted = false;
  try {
    for (const target of ["avatar", "background"] as const) {
      const photo = photos[target];
      if (!photo) continue;
      const compressed = await compressImageTo(
        photo.uri, photo.width, photo.height,
        target === "avatar" ? PROFILE_AVATAR_MAX_LONG_EDGE : PROFILE_BACKGROUND_MAX_LONG_EDGE,
        PROFILE_QUALITY,
      );
      const bytes = await new File(compressed.uri).bytes();
      const bucket = PHOTO_BUCKETS[target];
      // Never overwrite the current photo before the profile update succeeds.
      const path = `${user.id}/${Crypto.randomUUID()}.jpg`;
      const { error } = await supabase.storage.from(bucket).upload(path, bytes, {
        contentType: "image/jpeg",
        upsert: false,
      });
      if (error) throw error;
      uploaded.push({ bucket, path });
      const { data } = supabase.storage.from(bucket).getPublicUrl(path);
      photoUrls[target === "avatar" ? "avatar_url" : "background_url"] = data.publicUrl;
    }

    profileWriteStarted = true;
    // One row update commits the fields and both photo references together.
    // Explicitly list editable columns: identity, email, roles and status never write.
    const { data, error } = await supabase.from("users").update({
      mobile_number: fields.mobile_number,
      gender: fields.gender,
      street_address: fields.street_address.trim(),
      province: fields.province.trim(),
      city: fields.city.trim(),
      barangay: fields.barangay.trim(),
      postal_code: Number(fields.postal_code),
      ...photoUrls,
      updated_at: new Date().toISOString(),
    }).eq("user_id", user.id)
      .select("mobile_number, gender, street_address, province, city, barangay, postal_code, avatar_url, background_url")
      .single();
    if (error) throw error;
    if (!data) throw new ProfileEditError("Couldn't save your profile. Please try again.");
    return data;
  } catch (error) {
    // Before the row write, these uploads cannot be referenced. After a network
    // failure during the write, its outcome is uncertain: never delete a photo
    // that may already be committed to the profile.
    if (!profileWriteStarted) {
      for (const { bucket, path } of uploaded) {
        try {
          const { error: cleanupError } = await supabase.storage.from(bucket).remove([path]);
          if (cleanupError) console.error("Profile photo cleanup failed");
        } catch {
          console.error("Profile photo cleanup failed");
        }
      }
    }
    throw error;
  }
}
