"use client";

import { useState } from "react";
import Image from "next/image";
import { Button } from "@heroui/react";
import { IconPhoto } from "@tabler/icons-react";
import PhotoGalleryModal from "@/app/components/display/PhotoGalleryModal";

interface ImageHeaderProps {
  imageUrl: string[];
  name: string;
}

export default function ImageHeader({ imageUrl, name }: ImageHeaderProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const availableImages = imageUrl.filter(Boolean);
  const photos = (availableImages.length ? availableImages : ["/default/default-thumbnail.jpeg"]).map((url) => ({ url }));

  function openGallery(index: number) {
    setActiveIndex(index);
    setIsOpen(true);
  }

  return (
    <>
      <div className="relative flex h-128 w-full gap-5">
        <button type="button" className={`relative h-full overflow-hidden rounded-2xl focus-visible:outline-2 focus-visible:outline-primary ${photos.length > 1 ? "w-2/3" : "w-full"}`} onClick={() => openGallery(0)} aria-label={`View photos of ${name}`}>
          <Image src={photos[0].url} alt={`${name} cover`} fill className="object-cover transition hover:brightness-90" />
        </button>
        {photos.length > 1 ? (
          <div className="flex w-1/3 flex-col gap-5">
            {photos.slice(1, 3).map((photo, offset) => (
              <button key={`${photo.url}-${offset}`} type="button" onClick={() => openGallery(offset + 1)} className="relative min-h-0 flex-1 overflow-hidden rounded-2xl focus-visible:outline-2 focus-visible:outline-primary" aria-label={`View photo ${offset + 2} of ${name}`}>
                <Image src={photo.url} alt={`${name} photo ${offset + 2}`} fill className="object-cover transition hover:brightness-90" />
              </button>
            ))}
          </div>
        ) : null}
        <Button variant="tertiary" size="sm" className="absolute right-3 bottom-3 z-10 rounded-full bg-black/65 text-white hover:bg-black/80 focus-visible:outline-2 focus-visible:outline-white" onPress={() => openGallery(0)}>
          <IconPhoto size={18} aria-hidden="true" /> See all photos ({photos.length})
        </Button>
      </div>
      <PhotoGalleryModal name={name} photos={photos} isOpen={isOpen} onOpenChange={setIsOpen} activeIndex={activeIndex} onActiveIndexChange={setActiveIndex} />
    </>
  );
}
