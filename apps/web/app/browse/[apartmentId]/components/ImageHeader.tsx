"use client";

import { useState } from "react";
import Image from "next/image";
import { Button } from "@heroui/react";
import { IconPhoto } from "@tabler/icons-react";
import PhotoGalleryModal from "@/app/components/display/PhotoGalleryModal";

interface ImageHeaderProps {
  imageUrl: string[];
  thumbnailUrl?: string[];
  name: string;
  layout?: "default" | "sidebar-aligned";
}

export default function ImageHeader({ imageUrl, thumbnailUrl, name, layout = "default" }: ImageHeaderProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const availableImages = imageUrl.filter(Boolean);
  const availableThumbs = (thumbnailUrl ?? []).filter(Boolean);
  const photos = (availableImages.length ? availableImages : ["/default/default-thumbnail.jpeg"]).map((url, index) => ({
    url,
    thumbnailUrl: availableThumbs[index] ?? url,
  }));
  const sidebarAligned = layout === "sidebar-aligned";

  function openGallery(index: number) {
    setActiveIndex(index);
    setIsOpen(true);
  }

  return (
    <>
      <div className={`relative h-60 sm:h-96 lg:h-128 w-full min-w-0 ${sidebarAligned
        ? photos.length > 1
          ? "grid grid-cols-[minmax(0,2fr)_minmax(0,1fr)] gap-3 lg:grid-cols-[minmax(0,2fr)_minmax(280px,1fr)]"
          : "grid grid-cols-1 gap-3"
        : "flex gap-2 sm:gap-5"}`}>
        <Button variant="ghost" className={`button--bare relative h-full overflow-hidden rounded-2xl focus-visible:outline-2 focus-visible:outline-primary ${sidebarAligned || photos.length === 1 ? "w-full min-w-0" : "w-2/3"}`} onClick={() => openGallery(0)} aria-label={`View photos of ${name}`}>
          <Image src={photos[0].url} alt={`${name} cover`} fill priority sizes="(max-width: 1024px) 100vw, 66vw" className="object-cover transition hover:brightness-90" />
        </Button>
        {photos.length > 1 ? (
          <div className={`flex flex-col min-w-0 ${sidebarAligned ? "w-full gap-3" : "w-1/3 gap-2 sm:gap-5"}`}>
            {photos.slice(1, 3).map((photo, offset) => (
              <Button variant="ghost" key={`${photo.url}-${offset}`} onClick={() => openGallery(offset + 1)} className="button--bare relative min-h-0 flex-1 overflow-hidden rounded-2xl focus-visible:outline-2 focus-visible:outline-primary" aria-label={`View photo ${offset + 2} of ${name}`}>
                <Image src={photo.thumbnailUrl ?? photo.url} alt={`${name} photo ${offset + 2}`} fill sizes="(max-width: 1024px) 50vw, 25vw" className="object-cover transition hover:brightness-90" />
              </Button>
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
