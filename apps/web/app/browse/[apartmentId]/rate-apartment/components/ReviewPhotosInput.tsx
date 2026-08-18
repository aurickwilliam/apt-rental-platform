"use client";

import { useRef, useState } from "react";

import Image from "next/image";

import { Label } from "@heroui/react";
import { ImagePlus, Upload, X } from "lucide-react";

export type ReviewPhoto = {
  file: File;
  url: string;
};

export const MAX_REVIEW_IMAGES = 5;
export const MAX_REVIEW_IMAGE_SIZE_MB = 10;

const MAX_REVIEW_IMAGE_SIZE_BYTES = MAX_REVIEW_IMAGE_SIZE_MB * 1024 * 1024;

interface ReviewPhotosInputProps {
  images: ReviewPhoto[];
  onAdd: (files: File[]) => void;
  onRemove: (url: string) => void;
}

export default function ReviewPhotosInput({
  images,
  onAdd,
  onRemove,
}: ReviewPhotosInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [selectionError, setSelectionError] = useState<string | null>(null);

  const remainingSlots = MAX_REVIEW_IMAGES - images.length;
  const limitReached = remainingSlots <= 0;

  const handleSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    e.target.value = "";

    const valid: File[] = [];
    const rejected: string[] = [];

    for (const file of files) {
      if (!file.type.startsWith("image/")) {
        rejected.push(`${file.name} is not an image`);
      } else if (file.size > MAX_REVIEW_IMAGE_SIZE_BYTES) {
        rejected.push(`${file.name} exceeds the ${MAX_REVIEW_IMAGE_SIZE_MB}MB limit`);
      } else {
        valid.push(file);
      }
    }

    setSelectionError(rejected.length > 0 ? rejected.join(". ") : null);

    if (valid.length > 0) {
      onAdd(valid.slice(0, remainingSlots));
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium text-grey-700">Photos (optional)</Label>
        <span className="text-xs text-grey-400">
          {images.length} / {MAX_REVIEW_IMAGES}
        </span>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={handleSelect}
      />

      {images.length > 0 && (
        <div className="mt-2 grid grid-cols-3 gap-2">
          {images.map((photo) => (
            <div key={photo.url} className="group relative h-32 overflow-hidden rounded-xl">
              <Image
                src={photo.url}
                alt="Review photo"
                fill
                className="object-cover"
              />
              <div className="absolute inset-0 bg-black/0 transition group-hover:bg-black/20" />
              <button
                type="button"
                aria-label="Remove photo"
                onClick={() => onRemove(photo.url)}
                className="absolute right-1.5 top-1.5 rounded-full bg-black/60 p-1 text-white opacity-0 transition group-hover:opacity-100"
              >
                <X size={12} />
              </button>
            </div>
          ))}

          {!limitReached && (
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="flex h-32 flex-col items-center justify-center rounded-xl border-2 border-dashed border-grey-300 transition hover:border-primary hover:bg-primary/5"
            >
              <ImagePlus size={20} className="mb-1 text-grey-400" />
              <span className="text-xs text-grey-400">Add photo</span>
            </button>
          )}
        </div>
      )}

      {images.length === 0 && (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="mt-2 flex w-full flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-grey-300 py-6 transition hover:border-primary hover:bg-primary/5"
        >
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/10">
            <Upload size={22} className="text-primary" />
          </div>
          <span className="text-sm font-medium text-grey-600">Add photos</span>
          <span className="text-xs text-grey-400">
            PNG, JPG up to {MAX_REVIEW_IMAGE_SIZE_MB}MB
          </span>
        </button>
      )}

      {selectionError && (
        <p className="mt-1.5 text-xs text-red-600">{selectionError}</p>
      )}
    </div>
  );
}