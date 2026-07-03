import { useState } from "react";
import * as ImagePicker from "expo-image-picker";
import { supabase } from "@repo/supabase";
import { decode } from "base64-arraybuffer";

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
      base64: true,
    });

    if (result.canceled) return;

    const asset = result.assets[0];
    const base64Data = asset?.base64;

    if (!base64Data) return;

    const ext = asset.uri.split(".").pop() ?? "jpg";
    const contentType = `image/${ext === "jpg" ? "jpeg" : ext}`;
    const path = `${userId}/${userId}.${ext}`;

    setUploading(target);
    try {
      // 3. Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from(BUCKET_MAP[target])
        .upload(path, decode(base64Data), {
          contentType,
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