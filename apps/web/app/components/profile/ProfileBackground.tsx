"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";

import { Button, Spinner } from "@heroui/react";
import { IconCamera } from "@tabler/icons-react";

import { createBrowserClient } from "@repo/supabase";

import {
  compressBackgroundImage,
  uploadBackground,
  validateAvatarFile,
} from "@/lib/avatar-upload";
import ProfilePhotoErrorDialog from "./ProfilePhotoErrorDialog";

type ProfileBackgroundProps = {
  authUserId: string;
  initialUrl: string | null;
  staged?: boolean;
  onFileSelect?: (file: File | null) => void;
};

export default function ProfileBackground({
  authUserId,
  initialUrl,
  staged = false,
  onFileSelect,
}: ProfileBackgroundProps) {
  const [backgroundUrl, setBackgroundUrl] = useState(initialUrl);
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
      setBackgroundUrl(previewUrl);
      onFileSelect?.(file);
      if (inputRef.current) inputRef.current.value = "";
      return;
    }

    setError(null);
    setIsUploading(true);
    try {
      const supabase = createBrowserClient();
      const compressed = await compressBackgroundImage(file);
      const publicUrl = await uploadBackground(supabase, authUserId, compressed);
      setBackgroundUrl(publicUrl);
    } catch (e) {
      console.error("Background photo upload failed", e);
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
    <div className="relative h-28 w-full overflow-hidden rounded-t-3xl bg-muted sm:h-32">
      {backgroundUrl ? (
        <Image
          src={backgroundUrl}
          alt=""
          fill
          unoptimized
          className="object-cover"
        />
      ) : null}

      {isUploading ? (
        <div
          className="absolute inset-0 flex items-center justify-center bg-black/40"
          aria-hidden
        >
          <Spinner size="sm" color="current" className="text-white" />
        </div>
      ) : null}

      {error ? (
        <ProfilePhotoErrorDialog message={error} onClose={() => setError(null)} />
      ) : null}

      <Button
        type="button"
        isIconOnly
        size="sm"
        variant="secondary"
        aria-label="Change background photo"
        onPress={() => inputRef.current?.click()}
        isDisabled={isUploading}
        className="absolute right-2 bottom-2 border-2 border-background"
      >
        <IconCamera size={16} />
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
  );
}
