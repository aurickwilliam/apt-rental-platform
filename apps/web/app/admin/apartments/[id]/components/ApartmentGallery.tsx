"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Button } from "@heroui/react";
import { IconChevronLeft, IconPhoto } from "@tabler/icons-react";
import PhotoGalleryModal from "@/app/components/display/PhotoGalleryModal";
import type { ApartmentImage } from "../types";

interface ApartmentGalleryProps {
  name: string;
  images: ApartmentImage[];
  imagesError: boolean;
  backHref?: string;
  backLabel?: string;
}

export default function ApartmentGallery({ name, images, imagesError, backHref = "/admin/apartments", backLabel = "Back to apartments" }: ApartmentGalleryProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const cover = images[0];

  function openGallery(index: number) {
    setActiveIndex(index);
    setIsOpen(true);
  }

  return (
    <>
      <div className="relative h-56 w-full bg-muted sm:h-72">
        {cover && !imagesError ? (
          <button type="button" onClick={() => openGallery(0)} className="absolute inset-0 cursor-zoom-in focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary" aria-label={`View photos of ${name}`}>
            <Image src={cover.url} alt={`${name} cover`} fill unoptimized className="object-cover" />
          </button>
        ) : (
          <div className="flex h-full items-center justify-center gap-2 text-sm text-muted-foreground">
            <IconPhoto size={20} aria-hidden="true" />
            <span role={imagesError ? "alert" : undefined}>{imagesError ? "Property images could not be loaded." : "No property images available"}</span>
          </div>
        )}
        <Button variant="tertiary" size="sm" className="absolute top-3 left-3 z-10 rounded-full bg-black/65 text-white hover:bg-black/80 focus-visible:outline-2 focus-visible:outline-white" onPress={() => router.push(backHref)}>
          <IconChevronLeft size={18} aria-hidden="true" /> {backLabel}
        </Button>
        {cover && !imagesError ? (
          <Button variant="tertiary" size="sm" className="absolute right-3 bottom-3 z-10 rounded-full bg-black/65 text-white hover:bg-black/80 focus-visible:outline-2 focus-visible:outline-white" onPress={() => openGallery(0)}>
            <IconPhoto size={18} aria-hidden="true" /> See all photos ({images.length})
          </Button>
        ) : null}
      </div>

      {cover && !imagesError ? <PhotoGalleryModal name={name} photos={images.map((image) => ({ url: image.url, thumbnailUrl: image.url_thumb }))} isOpen={isOpen} onOpenChange={setIsOpen} activeIndex={activeIndex} onActiveIndexChange={setActiveIndex} /> : null}
    </>
  );
}
