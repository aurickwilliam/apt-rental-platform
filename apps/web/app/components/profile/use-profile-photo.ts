"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { toast } from "@heroui/react";
import { createClient as createBrowserClient } from "@repo/supabase/browser";

import {
  compressAvatarImage,
  compressBackgroundImage,
  removeAvatar,
  removeBackground,
  uploadAvatar,
  uploadBackground,
  validateAvatarFile,
} from "@/lib/avatar-upload";

export type ProfilePhotoKind = "avatar" | "cover";

/** Broadcast after a photo save/remove so client session data refreshes. */
export const PROFILE_PHOTO_UPDATED_EVENT = "apt:profile-photo-updated";

export function notifyProfilePhotoUpdated() {
  window.dispatchEvent(new CustomEvent(PROFILE_PHOTO_UPDATED_EVENT));
}

const KIND_LABEL: Record<ProfilePhotoKind, string> = {
  avatar: "Profile picture",
  cover: "Cover photo",
};

// Shared photo editor state machine: idle → preview → saving, plus a
// modal remove confirm owned by the caller. Upload only happens on Save;
// Cancel revokes the preview and restores the saved image. Removal only
// clears the displayed image after the storage + row update succeeds.
// Reuses the shared lib/avatar-upload pipeline (validate → compress →
// upload → users row).
export function useProfilePhotoUpload(
  authUserId: string,
  kind: ProfilePhotoKind,
  initialUrl: string | null,
) {
  const router = useRouter();
  const [savedUrl, setSavedUrl] = useState<string | null>(initialUrl);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const previewUrlRef = useRef<string | null>(null);

  const revokePreview = useCallback(() => {
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = null;
    }
  }, []);

  useEffect(() => () => revokePreview(), [revokePreview]);

  const selectFile = useCallback(
    (file: File | undefined) => {
      if (!file || isSaving || isRemoving) return;
      const validationError = validateAvatarFile(file);
      if (validationError) {
        setError(validationError);
        toast.danger(validationError, { timeout: 0 });
        return;
      }
      revokePreview();
      setError(null);
      const objectUrl = URL.createObjectURL(file);
      previewUrlRef.current = objectUrl;
      setPendingFile(file);
      setPreviewUrl(objectUrl);
    },
    [isSaving, isRemoving, revokePreview],
  );

  const cancel = useCallback(() => {
    revokePreview();
    setPendingFile(null);
    setPreviewUrl(null);
    setError(null);
  }, [revokePreview]);

  const save = useCallback(async () => {
    if (!pendingFile || isSaving || isRemoving) return false;
    setIsSaving(true);
    setError(null);
    try {
      const supabase = createBrowserClient();
      const publicUrl =
        kind === "avatar"
          ? await uploadAvatar(
              supabase,
              authUserId,
              await compressAvatarImage(pendingFile),
            )
          : await uploadBackground(
              supabase,
              authUserId,
              await compressBackgroundImage(pendingFile),
            );
      cancel();
      setSavedUrl(publicUrl);
      toast.success(
        `${KIND_LABEL[kind]} updated.`,
        { timeout: 3500 },
      );
      notifyProfilePhotoUpdated();
      router.refresh();
      return true;
    } catch (e) {
      const message =
        e instanceof Error ? e.message : "Upload failed. Please try again.";
      const friendlyMessage = /permission denied|row-level security/i.test(message)
        ? `Couldn't save your ${kind === "avatar" ? "photo" : "cover"} due to a permissions issue. Please try again later.`
        : message;
      setError(friendlyMessage);
      toast.danger(friendlyMessage, { timeout: 0 });
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [pendingFile, isSaving, isRemoving, authUserId, kind, cancel, router]);

  const remove = useCallback(async () => {
    if (isSaving || isRemoving) return false;
    setIsRemoving(true);
    setError(null);
    try {
      const supabase = createBrowserClient();
      if (kind === "avatar") await removeAvatar(supabase, authUserId);
      else await removeBackground(supabase, authUserId);
      cancel();
      setSavedUrl(null);
      toast.success(
        `${KIND_LABEL[kind]} removed.`,
        { timeout: 3500 },
      );
      notifyProfilePhotoUpdated();
      router.refresh();
      return true;
    } catch (e) {
      const message =
        e instanceof Error ? e.message : "Couldn't remove the photo. Please try again.";
      toast.danger(message, { timeout: 0 });
      setError(message);
      return false;
    } finally {
      setIsRemoving(false);
    }
  }, [isSaving, isRemoving, authUserId, kind, cancel, router]);

  return {
    savedUrl,
    previewUrl,
    isPreviewing: pendingFile !== null,
    isSaving,
    isRemoving,
    isBusy: isSaving || isRemoving,
    error,
    selectFile,
    cancel,
    save,
    remove,
  };
}
