import { useState } from "react";
import * as ImagePicker from "expo-image-picker";
import { File } from "expo-file-system";
import { supabase } from "@repo/supabase";

import { invalidateCurrentUser } from "@/utils/queryClient";
import {
  compressImageTo,
  PROFILE_AVATAR_MAX_LONG_EDGE,
  PROFILE_BACKGROUND_MAX_LONG_EDGE,
  PROFILE_QUALITY,
} from "@/utils/compressImage";

type UploadTarget = "avatar" | "background";

const BUCKET_MAP: Record<UploadTarget, string> = {
  avatar: "avatars",
  background: "background_photos",
};

export function useImageUpload(
  userId: string | undefined,
  onError?: (message: string) => void,
) {
  const [uploading, setUploading] = useState<UploadTarget | null>(null);

  const handleError = (message: string) => {
    if (onError) {
      onError(message);
    } else {
      alert(message); // fallback if no handler provided
    }
  };

  const pickAndUpload = async (
    target: UploadTarget,
    onSuccess: (publicUrl: string) => void,
  ) => {
    if (!userId) {
      handleError("User not found. Please try again.");
      return;
    }
    // Request permission
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      handleError("Permission to access photos is required.");
      return;
    }

    // Launch picker
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"] satisfies ImagePicker.MediaType[],
      allowsEditing: true,
      // Square crop for avatar, wide for background
      aspect: target === "avatar" ? [1, 1] : [16, 9],
      quality: 0.8,
    });

    if (result.canceled) return;

    const asset = result.assets[0];
    if (!asset) return;

    setUploading(target);
    try {
      // Compress & resize before upload (avatars are small; backgrounds are full-bleed)
      const maxLongEdge =
        target === "avatar"
          ? PROFILE_AVATAR_MAX_LONG_EDGE
          : PROFILE_BACKGROUND_MAX_LONG_EDGE;
      const compressed = await compressImageTo(
        asset.uri,
        asset.width,
        asset.height,
        maxLongEdge,
        PROFILE_QUALITY,
      );

      const path = `${userId}/${userId}.jpg`;

      // Upload to Supabase Storage (binary — avoids base64's ~33% overhead)
      const file = new File(compressed.uri);
      const bytes = await file.bytes();

      const { error: uploadError } = await supabase.storage
        .from(BUCKET_MAP[target])
        .upload(path, bytes, {
          contentType: "image/jpeg",
          upsert: true, // overwrite existing file
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data } = supabase.storage
        .from(BUCKET_MAP[target])
        .getPublicUrl(path);
      // Bust the cache so the Image component re-fetches
      const publicUrl = `${data.publicUrl}?t=${Date.now()}`;

      // Update the users table
      const column = target === "avatar" ? "avatar_url" : "background_url";
      const { error: dbError } = await supabase
        .from("users")
        .update({ [column]: publicUrl, updated_at: new Date().toISOString() })
        .eq("user_id", userId);

      if (dbError) throw dbError;

      await invalidateCurrentUser();
      onSuccess(publicUrl);
    } catch (err) {
      console.error("Image upload failed:", err);
      handleError("Failed to upload image. Please try again.");
    } finally {
      setUploading(null);
    }
  };

  return { pickAndUpload, uploading };
}