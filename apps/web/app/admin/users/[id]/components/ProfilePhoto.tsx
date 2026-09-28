"use client";

import Image from "next/image";
import { useState } from "react";

interface ProfilePhotoProps {
  src: string | null;
  name: string;
  initials: string;
}

export default function ProfilePhoto({ src, name, initials }: ProfilePhotoProps) {
  const [failed, setFailed] = useState(false);
  const showImage = Boolean(src) && !failed;
  return (
    <div className="relative -mt-12 size-24 shrink-0 overflow-hidden rounded-full border-4 border-background bg-primary">
      <span className="flex h-full w-full items-center justify-center text-xl font-bold text-white">
        {initials}
      </span>
      {showImage ? (
        <Image
          src={src as string}
          alt={name}
          fill
          unoptimized
          className="object-cover"
          onError={() => setFailed(true)}
        />
      ) : null}
    </div>
  );
}
