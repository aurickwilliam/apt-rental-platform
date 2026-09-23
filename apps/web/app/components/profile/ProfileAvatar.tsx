"use client";

import { useRef, useState } from "react";

import { Avatar, Button, Spinner } from "@heroui/react";
import { Camera } from "lucide-react";

import { createBrowserClient } from "@repo/supabase";

import { compressAvatarImage, uploadAvatar, validateAvatarFile } from "@/lib/avatar-upload";

type ProfileAvatarProps = {
  authUserId: string;
  initialUrl: string | null;
  initials: string;
  displayName: string;
};

export default function ProfileAvatar({
  authUserId,
  initialUrl,
  initials,
  displayName,
}: ProfileAvatarProps) {
  const [avatarUrl, setAvatarUrl] = useState(initialUrl);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File | undefined) => {
    if (!file || isUploading) return;

    const validationError = validateAvatarFile(file);
    if (validationError) {
      setError(validationError);
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
      setError(e instanceof Error ? e.message : "Upload failed. Please try again.");
    } finally {
      setIsUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative">
        <Avatar size="lg" className="size-36 border-4 border-background bg-primary text-white">
          {avatarUrl ? (
            <Avatar.Image src={avatarUrl} alt={`${displayName}'s profile photo`} />
          ) : null}
          <Avatar.Fallback className="bg-primary text-white font-semibold text-4xl">
            {initials}
          </Avatar.Fallback>
        </Avatar>

        {isUploading ? (
          <div
            className="absolute inset-0 flex items-center justify-center rounded-3xl bg-black/40"
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
          className="absolute -bottom-1 -right-1 border-2 border-background"
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
        <p role="alert" className="text-xs text-danger text-center max-w-56">
          {error}
        </p>
      ) : null}
    </div>
  );
}
