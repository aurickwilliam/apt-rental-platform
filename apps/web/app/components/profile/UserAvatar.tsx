"use client";

import { useState } from "react";

import { Avatar } from "@heroui/react";

type UserAvatarProps = {
  /** Photo URL (users.avatar_url). Empty/null/invalid shows the fallback. */
  src?: string | null;
  /** Fallback text (usually initials) shown when there is no photo. */
  initials: string;
  /** Accessible label for the image. */
  alt: string;
  /** HeroUI avatar size. Defaults to "md"; callers keep their own sizes. */
  size?: "sm" | "md" | "lg";
  /** Extra classes for the Avatar root (sizing, ring, shape). */
  className?: string;
  /** Extra classes for the image (object-cover applied by default). */
  imageClassName?: string;
  /** Extra classes for the initials fallback. */
  fallbackClassName?: string;
};

// Single shared avatar renderer: photo with object-cover, consistent
// initials fallback when the photo is missing or fails to load.
export default function UserAvatar({
  src,
  initials,
  alt,
  size = "md",
  className,
  imageClassName,
  fallbackClassName,
}: UserAvatarProps) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const trimmed = src?.trim() || "";
  // Reset a recorded load failure whenever the URL changes (render-phase
  // adjustment, so a retried/new URL renders the image again).
  if (failedSrc !== null && failedSrc !== trimmed) {
    setFailedSrc(null);
  }
  const showImage = Boolean(trimmed) && failedSrc !== trimmed;

  return (
    <Avatar size={size} className={className}>
      {showImage ? (
        <Avatar.Image
          src={trimmed}
          alt={alt}
          className={`object-cover ${imageClassName ?? ""}`}
          onError={() => setFailedSrc(trimmed)}
        />
      ) : null}
      <Avatar.Fallback className={fallbackClassName}>
        {initials}
      </Avatar.Fallback>
    </Avatar>
  );
}
