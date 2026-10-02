"use client";

import { useEffect, useRef, useState } from "react";

import { Avatar, Button, Spinner } from "@heroui/react";
import { Camera } from "lucide-react";

import { createBrowserClient } from "@repo/supabase";

import { compressAvatarImage, uploadAvatar, validateAvatarFile } from "@/lib/avatar-upload";
import ProfilePhotoErrorDialog from "./ProfilePhotoErrorDialog";

type ProfileAvatarProps = {
  authUserId: string;
  initialUrl: string | null;
  initials: string;
  displayName: string;
  circular?: boolean;
  staged?: boolean;
  onFileSelect?: (file: File | null) => void;
};

export default function ProfileAvatar({
  authUserId,
  initialUrl,
  initials,
  displayName,
  circular = false,
  staged = false,
  onFileSelect,
}: ProfileAvatarProps) {
  const [avatarUrl, setAvatarUrl] = useState(initialUrl);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const blobUrlRef = useRef<string | null>(null);

  useEffect(
    () => () => {
      if (blobUrlRef.current) URL.revokeObjectURL(blobUrlRef.current);
    },
    [],
  );

  const handleFile = async (file: File | undefined) => {
    if (!file || isUploading) return;

    const validationError = validateAvatarFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    if (staged) {
      const previewUrl = URL.createObjectURL(file);
      if (blobUrlRef.current) URL.revokeObjectURL(blobUrlRef.current);
      blobUrlRef.current = previewUrl;
      setAvatarUrl(previewUrl);
      onFileSelect?.(file);
      if (inputRef.current) inputRef.current.value = "";
      return;
    }

    setError(null);
    setIsUploading(true);
    try {
      const supabase = createBrowserClient();
      const compressed = await compressAvatarImage(file);
      const publicUrl = await uploadAvatar(supabase, authUserId, compressed);
      setAvatarUrl(publicUrl);
    } catch (e) {
      console.error("Profile photo upload failed", e);
      const raw = e instanceof Error ? e.message : "Upload failed. Please try again.";
      setError(
        /permission denied|row-level security/i.test(raw)
          ? "Couldn't save your photo due to a permissions issue. Please try again later."
          : raw,
      );
    } finally {
      setIsUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative">
        <Avatar
          size="lg"
          className={`size-36 border-4 border-background bg-primary text-white ${circular ? "rounded-full" : ""}`}
        >
          {avatarUrl ? (
            <Avatar.Image
              src={avatarUrl}
              alt={`${displayName}'s profile photo`}
              className="object-cover"
            />
          ) : null}
          <Avatar.Fallback
            className={`bg-primary text-white font-semibold text-4xl ${circular ? "rounded-full" : ""}`}
          >
            {initials}
          </Avatar.Fallback>
        </Avatar>

        {isUploading ? (
          <div
            className={`absolute inset-0 flex items-center justify-center bg-black/40 ${circular ? "rounded-full" : "rounded-3xl"}`}
            aria-hidden
          >
            <Spinner size="sm" color="current" className="text-white" />
          </div>
        ) : null}

        <Button
          type="button"
          isIconOnly
          size="sm"
          variant="secondary"
          aria-label="Change profile photo"
          onPress={() => inputRef.current?.click()}
          isDisabled={isUploading}
          className={`absolute border-2 border-background ${circular ? "right-1 bottom-1" : "-right-1 -bottom-1"}`}
        >
          <Camera size={16} />
        </Button>

        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          tabIndex={-1}
          aria-hidden
          onChange={(e) => handleFile(e.target.files?.[0])}
        />
      </div>

      {error ? (
        <ProfilePhotoErrorDialog message={error} onClose={() => setError(null)} />
      ) : null}
    </div>
  );
}
